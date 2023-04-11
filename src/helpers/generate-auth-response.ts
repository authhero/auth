// This should probably live somewhere else.

import { Context } from "cloudworker-router";
import { TokenFactory } from "../services/token-factory";
import { getCertificate } from "../models";
import { Env, AuthParams } from "../types";
import { TokenResponse } from "../types/Token";
import { ACCESS_TOKEN_EXPIRE_IN_SECONDS } from "../constants";

export interface GenerateAuthResponseParams {
  ctx: Context<Env>;
  userId: string;
  authParams: AuthParams;
}

export async function generateAuthResponse({
  ctx,
  userId,
  authParams,
}: GenerateAuthResponseParams) {
  const certificate = await getCertificate(ctx);
  const tokenFactory = new TokenFactory(
    certificate.privateKey,
    certificate.kid
  );

  const accessToken = await tokenFactory.createAccessToken({
    scopes: authParams.scope?.split(" ") || [],
    userId,
    iss: ctx.env.AUTH_DOMAIN_URL,
  });

  const idToken = await tokenFactory.createIDToken({
    clientId: authParams.clientId,
    userId: userId,
    given_name: "given",
    family_name: "familiy",
    nickname: "nick",
    name: "name",
    iss: ctx.env.AUTH_DOMAIN_URL,
    nonce: authParams.nonce,
  });

  if (!accessToken || !idToken) {
    throw new Error("This should never be undefined");
  }

  const tokenResponse: TokenResponse = {
    access_token: accessToken,
    id_token: idToken,
    token_type: "Bearer",
    scope: authParams.scope,
    expires_in: ACCESS_TOKEN_EXPIRE_IN_SECONDS,
  };

  return tokenResponse;
}
