import { Context } from "cloudworker-router";
import { Env } from "../types/Env";
import UserClient from "../models/UserClient";
import { PasswordlessGrantTypeParams, TokenResponse } from "../types/Token";
import { TokenFactory } from "../services/token-factory";
import { getCertificate } from "../models/Certificate";
import { StatusResponse } from "../types/IUser";

export default async function passwordlessGrant(
  ctx: Context<Env>,
  params: PasswordlessGrantTypeParams
): Promise<TokenResponse | null> {
  const user = new UserClient(ctx, params.username);

  const response: StatusResponse = await user.validateCode(params.otp);

  if (!response.ok) {
    return null;
  }

  const certificate = await getCertificate(ctx);
  const tokenFactory = new TokenFactory(
    certificate.privateKey,
    certificate.kid
  );

  const token = await tokenFactory.createToken({
    scopes: params.scope?.split(" ") ?? [],
    userId: params.username,
  });

  if (!token) {
    return null;
  }

  return {
    access_token: token,
    token_type: "bearer",
    expires_in: 86400,
  };
}
