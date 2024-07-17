import {
  Env,
  Var,
  AuthParams,
  AuthorizationResponseType,
  User,
  LogTypes,
  Client,
} from "../types";
import { CodeResponse, TokenResponse } from "../types/Token";
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

export type AuthFlowType =
  | "cross-origin"
  | "same-origin"
  | "refresh-token"
  | "code";

export interface GenerateAuthResponseParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  user: User | Client;
  sid: string;
  tenantId: string;
  state?: string;
  nonce?: string;
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
  tenantId,
  user,
  state,
  nonce,
  authParams,
}: GenerateAuthResponseParams) {
  const { env } = ctx;
  const code = nanoid();

  const user_id = "user_id" in user ? user.user_id : user.id;

  await env.data.authenticationCodes.create(tenantId, {
    user_id,
    authParams: {
      client_id: authParams.client_id,
      redirect_uri: authParams.redirect_uri,
      response_type: authParams.response_type,
      response_mode: authParams.response_mode,
      scope: authParams.scope,
      nonce,
    },
    nonce,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 1000).toISOString(),
    code,
  });

  const codeResponse: CodeResponse = {
    code,
    state,
  };

  return codeResponse;
}

export async function generateTokens(params: GenerateAuthResponseParams) {
  const { ctx, authParams, user, state, sid, nonce, authFlow } = params;
  const { env } = ctx;

  const user_id = "user_id" in user ? user.user_id : user.id;

  // Update the user's last login. Skip for client_credentials and refresh_tokens
  if (authFlow !== "refresh-token" && "email" in params.user) {
    // Invoke webhooks
    await postUserLoginWebhook(env.data)(params.tenantId, params.user);

    waitUntil(
      ctx,
      ctx.env.data.users.update(params.tenantId, user_id, {
        last_login: new Date().toISOString(),
        login_count: params.user.login_count + 1,
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
      sub: user_id,
      iss: env.ISSUER,
      azp: params.tenantId,
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
    state,
    scope: authParams.scope,
    expires_in: ACCESS_TOKEN_EXPIRE_IN_SECONDS,
  };

  // ID TOKEN
  if (
    authParams.response_type === AuthorizationResponseType.TOKEN_ID_TOKEN &&
    "email" in user
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
        nonce: nonce || authParams.nonce,
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
  const { ctx } = params;
  const log = createLogMessage(params.ctx, {
    type: getLogTypeByAuthFlow(params.authFlow),
    description: "Successful login",
  });
  waitUntil(ctx, ctx.env.data.logs.create(params.tenantId, log));

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
  const { authParams, sid } = params;

  const tokens = await generateAuthData(params);

  const redirectUrl = applyTokenResponse(tokens, authParams);

  const sessionCookie = serializeAuthCookie(sid);

  // TODO: should we have different response for different response modes?
  return new Response("Redirecting", {
    status: 302,
    headers: {
      Location: redirectUrl,
      "Set-Cookie": sessionCookie,
    },
  });
}
