// This should probably live somewhere else.

import { Context } from "cloudworker-router";
import { TokenFactory } from "../services/token-factory";
import { getCertificate, User } from "../models";
import { Env, AuthParams } from "../types";
import { TokenResponse } from "../types/Token";
import { ACCESS_TOKEN_EXPIRE_IN_SECONDS } from "../constants";

export interface GenerateAuthResponseParams {
  ctx: Context<Env>;
  userId: string;
  state?: string;
  nonce?: string;
  authParams: AuthParams;
}

export async function generateAuthResponse({
  ctx,
  userId,
  state,
  nonce,
  authParams,
}: GenerateAuthResponseParams) {
  const certificate = await getCertificate(ctx);
  const tokenFactory = new TokenFactory(
    certificate.privateKey,
    certificate.kid
  );

  const userInstance = await User.getInstanceByName(ctx.env.USER, userId);
  const profile = await userInstance.getProfile.query();

  const accessToken = await tokenFactory.createAccessToken({
    scopes: authParams.scope?.split(" ") || [],
    userId,
    iss: ctx.env.AUTH_DOMAIN_URL,
  });

  const idToken = await tokenFactory.createIDToken({
    clientId: authParams.clientId,
    userId: userId,
    given_name: profile.given_name,
    family_name: profile.family_name,
    nickname: profile.nickname,
    name: profile.name,
    iss: ctx.env.AUTH_DOMAIN_URL,
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
