import { Controller } from "@tsoa/runtime";
import { Context } from "hono";
import {
  AuthorizationResponseType,
  AuthParams,
  Client,
  Env,
  LoginState,
} from "../types";
import { headers } from "../constants";
import { hexToBase64 } from "../utils/base64";
import { getClient } from "../services/clients";
import { getId } from "../models";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { parseJwt } from "../utils/parse-jwt";
import { applyTokenResponse } from "../helpers/apply-token-response";
import { InvalidConnectionError } from "../errors";
import { validateRedirectUrl } from "../utils/validate-redirect-url";
import { Var } from "../types/Var";

export interface SocialAuthState {
  authParams: AuthParams;
  connection: string;
}

export async function socialAuth(
  env: Env,
  controller: Controller,
  client: Client,
  connection: string,
  authParams: AuthParams,
) {
  const connectionInstance = client.connections.find(
    (p) => p.name === connection,
  );
  if (!connectionInstance) {
    throw new InvalidConnectionError("Connection not found");
  }

  const stateId = env.STATE.newUniqueId().toString();
  const stateInstance = env.stateFactory.getInstanceById(stateId);
  await stateInstance.createState.mutate({
    state: JSON.stringify({ authParams, connection }),
  });

  const oauthLoginUrl = new URL(connectionInstance.authorization_endpoint);
  if (connectionInstance.scope) {
    oauthLoginUrl.searchParams.set("scope", connectionInstance.scope);
  }
  oauthLoginUrl.searchParams.set("state", hexToBase64(stateId));
  oauthLoginUrl.searchParams.set("redirect_uri", `${env.ISSUER}callback`);
  oauthLoginUrl.searchParams.set("client_id", connectionInstance.client_id);
  if (connectionInstance.response_type) {
    oauthLoginUrl.searchParams.set(
      "response_type",
      connectionInstance.response_type,
    );
  }
  if (connectionInstance.response_mode) {
    oauthLoginUrl.searchParams.set(
      "response_mode",
      connectionInstance.response_mode,
    );
  }
  controller.setHeader(headers.location, oauthLoginUrl.href);
  controller.setStatus(302);
  return `Redirecting to ${connection}`;
}

export interface socialAuthCallbackParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  controller: Controller;
  state: LoginState;
  code: string;
}

export async function socialAuthCallback({
  ctx,
  controller,
  state,
  code,
}: socialAuthCallbackParams) {
  const { env } = ctx;
  const client = await getClient(env, state.authParams.client_id);

  const connection = client.connections.find(
    (p) => p.name === state.connection,
  );

  if (!connection) {
    throw new Error("Connection not found");
  }

  if (!state.authParams.redirect_uri) {
    throw new Error("Redirect URI not defined");
  }

  validateRedirectUrl(
    client.allowed_callback_urls,
    state.authParams.redirect_uri,
  );

  const oauth2Client = env.oauth2ClientFactory.create(
    connection,
    `${env.ISSUER}callback`,
  );

  const token = await oauth2Client.exchangeCodeForTokenResponse(code);

  const oauth2Profile = parseJwt(token.id_token!);

  const email = oauth2Profile.email.toLocaleLowerCase();
  const userId = getId(client.tenant_id, email);
  ctx.set("email", email);
  ctx.set("userId", userId);

  const user = env.userFactory.getInstanceByName(userId);

  const profile = await user.loginWithConnection.mutate({
    email,
    tenantId: client.tenant_id,
    connection: { name: connection.name, profile: oauth2Profile },
  });

  const sessionId = await setSilentAuthCookies(
    env,
    controller,
    client.tenant_id,
    client.id,
    profile,
    state.authParams,
  );

  const tokenResponse = await generateAuthResponse({
    env,
    userId,
    sid: sessionId,
    state: state.authParams.state,
    nonce: state.authParams.nonce,
    authParams: state.authParams,
    user: profile,
    responseType:
      state.authParams.response_type || AuthorizationResponseType.TOKEN,
  });

  return applyTokenResponse(controller, tokenResponse, state.authParams);
}
