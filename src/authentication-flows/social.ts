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
  const client = await ctx.env.data.clients.get(state.authParams.client_id);
  if (!client) {
    throw new HTTPException(403, { message: "Client not found" });
  }
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
  const strictEmailVerified = !!email_verified;

  const newUserFields: Partial<BaseUser> = {
    profileData: JSON.stringify(profileData),
    email,
  };

  const ssoId = `${state.connection}|${sub}`;
  let user = await env.data.users.get(client.tenant_id, ssoId);

  // TODO
  // here need to check linked_to property, and fetch that primary user instead!
  // TODO - in later test and functionality

  if (!state.connection) {
    throw new HTTPException(403, { message: "Connection not found" });
  }

  if (!user) {
    const sameEmailUser = await env.data.users.getByEmail(
      client.tenant_id,
      // TODO - this needs to ONLY fetch primary users e.g. where linked_to is null
      email,
    );

    // this means we have a primary account
    if (sameEmailUser) {
      user = sameEmailUser;

      // so here we create the new social user, but we do nothing with it
      const newSocialUser = await env.data.users.create(client.tenant_id, {
        id: `${state.connection}|${sub}`,
        email,
        tenant_id: client.tenant_id,
        name: email,
        provider: state.connection,
        connection: state.connection,
        email_verified: strictEmailVerified,
        last_ip: "",
        login_count: 0,
        is_social: true,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        linked_to: sameEmailUser.id,
      });
    } else {
      // here we are using the new user as the primary ccount
      user = await env.data.users.create(client.tenant_id, {
        // de-dupe these args!
        id: `${state.connection}|${sub}`,
        email,
        tenant_id: client.tenant_id,
        name: email,
        provider: state.connection,
        connection: state.connection,
        email_verified: strictEmailVerified,
        last_ip: "",
        login_count: 0,
        is_social: true,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  ctx.set("email", email);
  ctx.set("userId", user.id);

  // this checks everytime we get the id_token that the email is verified, and updates the user in the db
  // possibly excessive and we could just set email_verified:true when creating the new social user (above)
  if (email_verified) {
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
