// This should probably live somewhere else.
import { getCertificate } from "../models";
import { Env, AuthParams, CodeChallengeMethod } from "../types";
import { TokenResponse } from "../types/Token";
import { ACCESS_TOKEN_EXPIRE_IN_SECONDS } from "../constants";
import { hexToBase64 } from "../utils/base64";

export interface GenerateAuthResponseParams {
  env: Env;
  userId: string;
  sid: string;
  state?: string;
  nonce?: string;
  authParams: AuthParams;
  user: {
    email: string;
    name?: string;
    givenName?: string;
    familyName?: string;
    nickname?: string;
  };
  code_challenge_method?: CodeChallengeMethod;
  code_challenge?: string;
}

export async function generateCode({
  env,
  userId,
  state,
  nonce,
  authParams,
  user,
  sid,
  code_challenge_method,
  code_challenge,
}: GenerateAuthResponseParams) {
  const stateId = env.STATE.newUniqueId().toString();
  const stateInstance = env.stateFactory.getInstanceById(stateId);
  await stateInstance.createState.mutate({
    state: JSON.stringify({
      userId,
      authParams,
      nonce,
      state,
      user,
      sid,
      code_challenge_method,
      code_challenge,
    }),
  });

  return hexToBase64(stateId);
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

  const accessToken = await tokenFactory.createAccessToken({
    scopes: authParams.scope?.split(" ") || [],
    userId,
    iss: env.ISSUER,
  });

  const idToken = await tokenFactory.createIDToken({
    clientId: authParams.client_id,
    userId: userId,
    given_name: profile.givenName,
    family_name: profile.familyName,
    nickname: profile.nickname,
    name: profile.name,
    iss: env.ISSUER,
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
