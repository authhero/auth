// This should probably live somewhere else.
import { getCertificate } from "../models";
import { Env, AuthParams } from "../types";
import { TokenResponse } from "../types/Token";
import { ACCESS_TOKEN_EXPIRE_IN_SECONDS } from "../constants";

export interface GenerateAuthResponseParams {
  env: Env;
  userId: string;
  state?: string;
  nonce?: string;
  authParams: AuthParams;
}

export async function generateAuthResponse({
  env,
  userId,
  state,
  nonce,
  authParams,
}: GenerateAuthResponseParams) {
  const certificate = await getCertificate(env);
  const tokenFactory = new env.TokenFactory(
    certificate.privateKey,
    certificate.kid
  );

  const userInstance = await env.userFactory.getInstanceByName(userId);
  const profile = await userInstance.getProfile.query();

  if (!profile) {
    throw new Error("No profile found for user");
  }

  const accessToken = await tokenFactory.createAccessToken({
    scopes: authParams.scope?.split(" ") || [],
    userId,
    iss: env.AUTH_DOMAIN_URL,
  });

  const idToken = await tokenFactory.createIDToken({
    clientId: authParams.clientId,
    userId: userId,
    given_name: profile.given_name,
    family_name: profile.family_name,
    nickname: profile.nickname,
    name: profile.name,
    iss: env.AUTH_DOMAIN_URL,
    nonce: nonce || authParams.nonce,
  });

  if (!accessToken || !idToken) {
    throw new Error("This should never be undefined");
  }

  const tokenResponse: TokenResponse = {
    access_token: accessToken,
    id_token: idToken,
    token_type: "Bearer",
    state,
    scope: authParams.scope,
    expires_in: ACCESS_TOKEN_EXPIRE_IN_SECONDS,
  };

  return tokenResponse;
}
