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
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { parseJwt } from "../utils/parse-jwt";
import { applyTokenResponse } from "../helpers/apply-token-response";
import { validateRedirectUrl } from "../utils/validate-redirect-url";
import { Var } from "../types/Var";
import { HTTPException } from "hono/http-exception";
import { stateEncode } from "../utils/stateEncode";
import { getClient } from "../services/clients";
import { LogTypes } from "../types";
import {
  getPrimaryUserByEmailAndProvider,
  getPrimaryUserByEmail,
} from "../utils/users";

export async function socialAuth(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  controller: Controller,
  client: Client,
  connection: string,
  authParams: AuthParams,
) {
  const connectionInstance = client.connections.find(
    (p) => p.name === connection,
  );
  if (!connectionInstance) {
    ctx.set("logType", LogTypes.FAILED_LOGIN);
    throw new HTTPException(403, { message: "Connection Not Found" });
  }

  const state = stateEncode({ authParams, connection });

  const oauthLoginUrl = new URL(connectionInstance.authorization_endpoint);
  if (connectionInstance.scope) {
    oauthLoginUrl.searchParams.set("scope", connectionInstance.scope);
  }
  oauthLoginUrl.searchParams.set("state", state);
  oauthLoginUrl.searchParams.set("redirect_uri", `${ctx.env.ISSUER}callback`);
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

interface socialAuthCallbackParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  controller: Controller;
  state: LoginState;
  code: string;
}

function getProfileData(profile: any) {
  const {
    iss,
    azp,
    aud,
    at_hash,
    iat,
    exp,
    hd,
    jti,
    nonce,
    auth_time,
    nonce_supported,
    ...profileData
  } = profile;

  return profileData;
}

export async function socialAuthCallback({
  ctx,
  controller,
  state,
  code,
}: socialAuthCallbackParams) {
  const { env } = ctx;
  const client = await getClient(env, state.authParams.client_id);

  if (!client) {
    // I'm not sure if these are correct as need to reverse engineer what Auth0 does
    ctx.set("logType", LogTypes.FAILED_LOGIN);
    throw new HTTPException(403, { message: "Client not found" });
  }
  const connection = client.connections.find(
    (p) => p.name === state.connection,
  );

  if (!connection) {
    // same here. unsure
    ctx.set("logType", LogTypes.FAILED_LOGIN);
    throw new HTTPException(403, { message: "Connection not found" });
  }

  if (!state.authParams.redirect_uri) {
    // same here. unsure
    ctx.set("logType", LogTypes.FAILED_LOGIN);
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

  const token = await oauth2Client.exchangeCodeForTokenResponse(
    code,
    connection.token_exchange_basic_auth,
  );

  let userinfo: any;
  if (connection.userinfo_endpoint) {
    userinfo = getProfileData(
      await oauth2Client.getUserProfile(token.access_token),
    );
  } else if (token.id_token) {
    userinfo = getProfileData(parseJwt(token.id_token));
  } else {
    throw new HTTPException(500, {
      message: "No id_token or userinfo endpoint availeble",
    });
  }

  const { sub, email: emailRaw, ...profileData } = userinfo;

  const email = emailRaw.toLocaleLowerCase();
  const strictEmailVerified = !!profileData.email_verified;

  let user = await getPrimaryUserByEmailAndProvider({
    userAdapter: env.data.users,
    tenant_id: client.tenant_id,
    email,
    provider: connection.name,
  });

  if (!user) {
    ctx.set("logType", LogTypes.SUCCESS_SIGNUP);

    const primaryUser = await getPrimaryUserByEmail({
      userAdapter: env.data.users,
      tenant_id: client.tenant_id,
      email: email,
    });

    const newSocialUser = await env.data.users.create(client.tenant_id, {
      id: `${state.connection}|${sub}`,
      email,
      name: email,
      provider: connection.name,
      connection: connection.name,
      email_verified: strictEmailVerified,
      last_ip: "",
      login_count: 0,
      is_social: true,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profileData: JSON.stringify(profileData),
    });

    // this means we have a primary account
    if (primaryUser) {
      user = primaryUser;

      // link user with existing user
      await env.data.users.update(client.tenant_id, newSocialUser.id, {
        linked_to: primaryUser.id,
      });
    } else {
      // here we are using the new user as the primary ccount
      user = newSocialUser;
    }
  }

  ctx.set("tenantId", client.tenant_id);
  ctx.set("userName", email);
  ctx.set("userId", user.id);

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
