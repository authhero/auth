import { Controller } from "@tsoa/runtime";
import { Context } from "hono";
import {
  AuthorizationResponseType,
  AuthParams,
  Client,
  Env,
  LoginState,
  BaseUser,
} from "../types";
import { headers } from "../constants";
import { getClient } from "../services/clients";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { parseJwt } from "../utils/parse-jwt";
import { applyTokenResponse } from "../helpers/apply-token-response";
import { InvalidConnectionError } from "../errors";
import { validateRedirectUrl } from "../utils/validate-redirect-url";
import { Var } from "../types/Var";
import { HTTPException } from "hono/http-exception";
import { stateEncode } from "../utils/stateEncode";
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

  const state = stateEncode({ authParams, connection });

  const oauthLoginUrl = new URL(connectionInstance.authorization_endpoint);
  if (connectionInstance.scope) {
    oauthLoginUrl.searchParams.set("scope", connectionInstance.scope);
  }
  oauthLoginUrl.searchParams.set("state", state);
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
    throw new HTTPException(403, { message: "Connection not found" });
  }

  if (!state.authParams.redirect_uri) {
    throw new HTTPException(403, { message: "Redirect URI not defined" });
  }

  if (
    !validateRedirectUrl(
      client.allowed_callback_urls,
      state.authParams.redirect_uri,
    )
  ) {
    throw new HTTPException(403, {
      message: `Invalid redirect URI - ${state.authParams.redirect_uri}`,
    });
  }

  const oauth2Client = env.oauth2ClientFactory.create(
    connection,
    `${env.ISSUER}callback`,
  );

  const token = await oauth2Client.exchangeCodeForTokenResponse(code);

  const idToken = parseJwt(token.id_token!);

  const {
    iss,
    azp,
    aud,
    at_hash,
    iat,
    exp,
    sub,
    hd,
    jti,
    nonce,
    email: emailRaw,
    email_verified,
    auth_time,
    nonce_supported,
    ...profileData
  } = idToken;

  const email = emailRaw.toLocaleLowerCase();

  // TODO - this should actually be id! the social id pulled out before
  // we can fix once we've done account linking
  let user = await env.data.users.getByEmail(client.tenant_id, email);

  if (!state.connection) {
    throw new HTTPException(403, { message: "Connection not found" });
  }

  // for now just create a new user with the correct structure IF does not already existing
  // TODO - intelligent account linking!
  if (!user) {
    user = await env.data.users.create(client.tenant_id, {
      id: `${state.connection}|${sub}`,
      email,
      tenant_id: client.tenant_id,
      name: email,
      provider: state.connection,
      connection: state.connection,
      email_verified: false,
      last_ip: "",
      login_count: 0,
      is_social: false,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  ctx.set("email", email);
  ctx.set("userId", user.id);

  const newUserFields: Partial<BaseUser> = {
    profileData: JSON.stringify(profileData),
    email,
  };

  if (email_verified) {
    const strictEmailVerified = !!email_verified;
    newUserFields.email_verified = strictEmailVerified;
  }

  await env.data.users.update(
    client.tenant_id,
    ctx.get("userId"),
    newUserFields,
  );

  await env.data.logs.create({
    category: "login",
    message: `Login with ${connection.name}`,
    tenant_id: client.tenant_id,
    user_id: user.id,
  });

  const sessionId = await setSilentAuthCookies(
    env,
    controller,
    client.tenant_id,
    client.id,
    user,
  );

  const tokenResponse = await generateAuthResponse({
    env,
    userId: user.id,
    sid: sessionId,
    state: state.authParams.state,
    nonce: state.authParams.nonce,
    authParams: state.authParams,
    user,
    responseType:
      state.authParams.response_type || AuthorizationResponseType.TOKEN,
  });

  return applyTokenResponse(controller, tokenResponse, state.authParams);
}
