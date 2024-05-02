import {
  Env,
  AuthParams,
  AuthorizationResponseType,
  User,
  AuthorizationResponseMode,
} from "../types";
import { ACCESS_TOKEN_EXPIRE_IN_SECONDS } from "../constants";
import { TokenFactory } from "../services/token-factory";
import { stateEncode } from "../utils/stateEncode";
import { Context } from "hono";
import { TokenResponse } from "../services/oauth2-client";
import { applyTokenResponse } from "./apply-token-response-new";
import { serializeStateInCookie } from "../services/cookies";

interface GenerateAuthResponseParamsBase {
  userId: string;
  sid: string;
  state?: string;
  nonce?: string;
  authParams: AuthParams;
}

interface GenerateAuthResponseParamsForCode
  extends GenerateAuthResponseParamsBase {
  responseType: AuthorizationResponseType.CODE;
  user: User;
}

interface GenerateAuthResponseParamsForToken
  extends GenerateAuthResponseParamsBase {
  responseType: AuthorizationResponseType.TOKEN;
}

interface GenerateAuthResponseParamsForIdToken
  extends GenerateAuthResponseParamsBase {
  responseType: AuthorizationResponseType.TOKEN_ID_TOKEN;
  user: User;
}

async function generateCode(
  ctx: Context,
  {
    userId,
    state,
    nonce,
    authParams,
    sid,
    user,
  }: GenerateAuthResponseParamsForCode,
) {
  const code = stateEncode({ userId, authParams, nonce, state, sid, user });

  const codeResponse = {
    code,
    state,
  };

  return ctx.json(codeResponse);
}

export async function generateTokens(
  ctx: Context,
  params:
    | GenerateAuthResponseParamsForToken
    | GenerateAuthResponseParamsForIdToken,
) {
  const { authParams, userId, state, responseType, sid, nonce } = params;

  const certificates = await ctx.env.data.keys.list();
  const certificate = certificates[certificates.length - 1];
  const tokenFactory = new TokenFactory(
    certificate.private_key,
    certificate.kid,
  );

  const accessToken = await tokenFactory.createAccessToken({
    aud: authParams.audience,
    scope: authParams.scope || "",
    sub: userId,
    iss: ctx.env.ISSUER,
  });

  const tokenResponse: TokenResponse = {
    access_token: accessToken,
    token_type: "Bearer",
    state,
    scope: authParams.scope,
    expires_in: ACCESS_TOKEN_EXPIRE_IN_SECONDS,
  };

  // ID TOKEN
  if (responseType === AuthorizationResponseType.TOKEN_ID_TOKEN) {
    const { user } = params;

    tokenResponse.id_token = await tokenFactory.createIDToken({
      ...user,
      clientId: authParams.client_id,
      userId: userId,
      iss: ctx.env.ISSUER,
      sid,
      nonce: nonce || authParams.nonce,
    });
  }

  // REFRESH TOKEN
  // if (authParams.scope?.split(' ').includes('offline_access')) {
  //   const { refresh_token } = await createRefreshToken(params);
  //   tokenResponse.refresh_token = refresh_token;
  // }

  if (authParams.response_mode === AuthorizationResponseMode.WEB_MESSAGE) {
    return ctx.json(tokenResponse);
  }

  const redirectUrl = applyTokenResponse(tokenResponse, authParams);

  const sessionCookie = serializeStateInCookie(sid);

  return new Response("Redirecting", {
    status: 302,
    headers: {
      Location: redirectUrl,
      "Set-Cookie": sessionCookie[0],
    },
  });
}

type GenerateAuthResponseParams =
  | GenerateAuthResponseParamsForToken
  | GenerateAuthResponseParamsForIdToken
  | GenerateAuthResponseParamsForCode;

export async function generateAuthResponse(
  ctx: Context,
  params: GenerateAuthResponseParams,
) {
  switch (params.responseType) {
    case AuthorizationResponseType.TOKEN:
    case AuthorizationResponseType.TOKEN_ID_TOKEN:
      return generateTokens(ctx, params);
    case AuthorizationResponseType.CODE:
      return generateCode(ctx, params);
  }
}
