import { Env, Var, User, Client } from "../types";
import { ACCESS_TOKEN_EXPIRE_IN_SECONDS } from "../constants";
import { pemToBuffer } from "../utils/jwt";
import { createJWT } from "oslo/jwt";
import { TimeSpan } from "oslo";
import { serializeAuthCookie } from "../services/cookies";
import { applyTokenResponse } from "./apply-token-response-new";
import { nanoid } from "nanoid";
import { createLogMessage } from "../utils/create-log-message";
import { Context } from "hono";
import { waitUntil } from "../utils/wait-until";
import { postUserLoginWebhook } from "../hooks/webhooks";
import {
  AuthParams,
  AuthorizationResponseType,
  CodeResponse,
  LogTypes,
  TokenResponse,
} from "@authhero/adapter-interfaces";
import { setSilentAuthCookies } from "./silent-auth-cookie";

export type AuthFlowType =
  | "cross-origin"
  | "same-origin"
  | "refresh-token"
  | "code";

export interface GenerateAuthResponseParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  client: Client;
  user?: User;
  sid?: string;
  authParams: AuthParams;
  authFlow?: AuthFlowType;
}

function getLogTypeByAuthFlow(authFlow?: AuthFlowType) {
  switch (authFlow) {
    case "cross-origin":
      return LogTypes.SUCCESS_CROSS_ORIGIN_AUTHENTICATION;
    case "same-origin":
      return LogTypes.SUCCESS_LOGIN;
    case "refresh-token":
      return LogTypes.SUCCESS_EXCHANGE_REFRESH_TOKEN_FOR_ACCESS_TOKEN;
    case "code":
      return LogTypes.SUCCESS_EXCHANGE_AUTHORIZATION_CODE_FOR_ACCESS_TOKEN;
    default:
      return LogTypes.SUCCESS_LOGIN;
  }
}

async function generateCode({
  ctx,
  client,
  user,
  authParams,
}: GenerateAuthResponseParams) {
  const { env } = ctx;
  const code = nanoid();

  await env.data.authenticationCodes.create(client.tenant_id, {
    user_id: user?.user_id || client.id,
    authParams: {
      client_id: authParams.client_id,
      scope: authParams.scope,
      response_type: authParams.response_type,
      nonce: authParams.nonce,
      state: authParams.state,
    },
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 1000).toISOString(),
    code,
  });

  const codeResponse: CodeResponse = {
    code,
    state: authParams.state,
  };

  return codeResponse;
}

export async function generateTokens(params: GenerateAuthResponseParams) {
  const { ctx, client, authParams, user, sid, authFlow } = params;
  const { env } = ctx;

  // Update the user's last login. Skip for client_credentials and refresh_tokens
  if (authFlow !== "refresh-token" && user) {
    // Invoke webhooks
    await postUserLoginWebhook(env.data)(client.tenant_id, user);

    waitUntil(
      ctx,
      ctx.env.data.users.update(client.tenant_id, user.user_id, {
        last_login: new Date().toISOString(),
        login_count: user.login_count + 1,
        // This is specific to cloudflare
        last_ip: ctx.req.header("cf-connecting-ip"),
      }),
    );
  }

  const certificates = await env.data.keys.list();
  const certificate = certificates[certificates.length - 1];

  const keyBuffer = pemToBuffer(certificate.private_key);

  const accessToken = await createJWT(
    "RS256",
    keyBuffer,
    {
      aud: authParams.audience || "default",
      scope: authParams.scope || "",
      sub: user?.user_id || client.id,
      iss: env.ISSUER,
      azp: client.tenant_id,
    },
    {
      includeIssuedTimestamp: true,
      expiresIn: new TimeSpan(1, "d"),
      headers: {
        kid: certificate.kid,
      },
    },
  );

  const tokenResponse: TokenResponse = {
    access_token: accessToken,
    token_type: "Bearer",
    state: authParams.state,
    scope: authParams.scope,
    expires_in: ACCESS_TOKEN_EXPIRE_IN_SECONDS,
  };

  // ID TOKEN
  if (
    authParams.response_type === AuthorizationResponseType.TOKEN_ID_TOKEN &&
    user
  ) {
    tokenResponse.id_token = await createJWT(
      "RS256",
      keyBuffer,
      {
        // The audience for an id token is the client id
        aud: authParams.client_id,
        sub: user.user_id,
        iss: env.ISSUER,
        sid,
        nonce: authParams.nonce,
        given_name: user.given_name,
        family_name: user.family_name,
        nickname: user.nickname,
        picture: user.picture,
        locale: user.locale,
        name: user.name,
        email: user.email,
        email_verified: user.email_verified,
      },
      {
        includeIssuedTimestamp: true,
        expiresIn: new TimeSpan(1, "d"),
        headers: {
          kid: certificate.kid,
        },
      },
    );
  }

  // REFRESH TOKEN
  // if (authParams.scope?.split(' ').includes('offline_access')) {
  //   const { refresh_token } = await createRefreshToken(params);
  //   tokenResponse.refresh_token = refresh_token;
  // }

  return tokenResponse;
}

export async function generateAuthData(params: GenerateAuthResponseParams) {
  const { ctx, client } = params;
  const log = createLogMessage(params.ctx, {
    type: getLogTypeByAuthFlow(params.authFlow),
    description: "Successful login",
  });
  waitUntil(ctx, ctx.env.data.logs.create(client.tenant_id, log));

  switch (params.authParams.response_type) {
    case AuthorizationResponseType.CODE:
      return generateCode(params);
    case AuthorizationResponseType.TOKEN:
    case AuthorizationResponseType.TOKEN_ID_TOKEN:
    default:
      return generateTokens(params);
  }
}

export async function generateAuthResponse(params: GenerateAuthResponseParams) {
  const { ctx, authParams, sid, client, user } = params;

  const tokens = await generateAuthData(params);

  const headers = new Headers();
  headers.set("location", applyTokenResponse(tokens, authParams));

  if (user) {
    const sessionId =
      sid ||
      (await setSilentAuthCookies(ctx.env, client.tenant_id, client.id, user));

    headers.set("set-cookie", serializeAuthCookie(client.tenant_id, sessionId));
  }

  // TODO: should we have different response for different response modes?
  return new Response("Redirecting", {
    status: 302,
    headers,
  });
}
