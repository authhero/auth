import { Controller } from "@tsoa/runtime";
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
import { parseJwt } from "../utils/jwt";
import { applyTokenResponse } from "../helpers/apply-token-response";
import { InvalidConnectionError } from "../errors";
import { validateRedirectUrl } from "../utils/validate-redirect-url";

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

  const oauthLoginUrl = new URL(connectionInstance.authorizationEndpoint);
  if (authParams.scope) {
    oauthLoginUrl.searchParams.set("scope", authParams.scope);
  }
  oauthLoginUrl.searchParams.set("state", hexToBase64(stateId));
  oauthLoginUrl.searchParams.set("redirect_uri", `${env.ISSUER}callback`);
  oauthLoginUrl.searchParams.set("client_id", connectionInstance.clientId);
  oauthLoginUrl.searchParams.set("response_type", "code");
  controller.setHeader(headers.location, oauthLoginUrl.href);
  controller.setStatus(302);
  return `Redirecting to ${connection}`;
}

export interface socialAuthCallbackParams {
  env: Env;
  controller: Controller;
  state: LoginState;
  code: string;
}

export async function socialAuthCallback({
  env,
  controller,
  state,
  code,
}: socialAuthCallbackParams) {
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
    client.allowedCallbackUrls,
    state.authParams.redirect_uri,
  );

  const oauth2Client = env.oauth2ClientFactory.create(
    connection,
    `${env.ISSUER}callback`,
    state.authParams.scope?.split(" ") || [],
  );

  const token = await oauth2Client.exchangeCodeForTokenResponse(code);

  const oauth2Profile = parseJwt(token.id_token!);

  const userId = getId(client.tenantId, oauth2Profile.email);
  const user = env.userFactory.getInstanceByName(userId);

  const profile = await user.patchProfile.mutate({
    email: oauth2Profile.email,
    tenantId: client.tenantId,
    connections: [{ name: connection.name, profile: oauth2Profile }],
  });

  const sessionId = await setSilentAuthCookies(
    env,
    controller,
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
