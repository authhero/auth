import { Env, AuthParams, AuthorizationResponseType, User } from "../types";
import { CodeResponse, TokenResponse } from "../types/Token";
import { ACCESS_TOKEN_EXPIRE_IN_SECONDS } from "../constants";
import { pemToBuffer } from "../utils/jwt";
import { createJWT } from "oslo/jwt";
import { TimeSpan } from "oslo";
import { serializeStateInCookie } from "../services/cookies";
import { applyTokenResponse } from "./apply-token-response-new";
import { nanoid } from "nanoid";

interface GenerateAuthResponseParamsBase {
  env: Env;
  userId: string;
  sid: string;
  tenantId: string;
  state?: string;
  nonce?: string;
  authParams: AuthParams;
}

interface GenerateAuthResponseParamsForCode
  extends GenerateAuthResponseParamsBase {
  responseType: AuthorizationResponseType.CODE;
  user: User;
}

export interface GenerateAuthResponseParamsForToken
  extends GenerateAuthResponseParamsBase {
  responseType: AuthorizationResponseType.TOKEN;
}

interface GenerateAuthResponseParamsForIdToken
  extends GenerateAuthResponseParamsBase {
  responseType: AuthorizationResponseType.TOKEN_ID_TOKEN;
  user: User;
}

async function generateCode({
  env,
  tenantId,
  userId,
  state,
  nonce,
  authParams,
  sid,
}: GenerateAuthResponseParamsForCode) {
  const code = nanoid();

  await env.data.authenticationCodes.create(tenantId, {
    user_id: userId,
    authParams,
    nonce,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 1000).toISOString(),
    sid,
    code,
  });

  const codeResponse: CodeResponse = {
    code,
    state,
  };

  return codeResponse;
}

export async function generateTokens(
  params:
    | GenerateAuthResponseParamsForToken
    | GenerateAuthResponseParamsForIdToken,
) {
  const { env, authParams, userId, state, responseType, sid, nonce } = params;

  const certificates = await env.data.keys.list();
  const certificate = certificates[certificates.length - 1];

  const keyBuffer = pemToBuffer(certificate.private_key);

  const accessToken = await createJWT(
    "RS256",
    keyBuffer,
    {
      aud: authParams.audience || "default",
      scope: authParams.scope || "",
      sub: userId,
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
  if (responseType === AuthorizationResponseType.TOKEN_ID_TOKEN) {
    const { user } = params;

    tokenResponse.id_token = await createJWT(
      "RS256",
      keyBuffer,
      {
        // The audience for an id token is the client id
        aud: authParams.client_id,
        sub: userId,
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

type GenerateAuthResponseParams =
  | GenerateAuthResponseParamsForToken
  | GenerateAuthResponseParamsForIdToken
  | GenerateAuthResponseParamsForCode;

export async function generateAuthData(params: GenerateAuthResponseParams) {
  switch (params.responseType) {
    case AuthorizationResponseType.TOKEN:
    case AuthorizationResponseType.TOKEN_ID_TOKEN:
      return generateTokens(params);
    case AuthorizationResponseType.CODE:
      return generateCode(params);
  }
}

export async function generateAuthResponse(params: GenerateAuthResponseParams) {
  const { authParams, sid } = params;

  const tokens = await generateAuthData(params);

  const redirectUrl = applyTokenResponse(tokens, authParams);

  const sessionCookie = serializeStateInCookie(sid);

  return new Response("Redirecting", {
    status: 302,
    headers: {
      Location: redirectUrl,
      "Set-Cookie": sessionCookie[0],
    },
  });
}
