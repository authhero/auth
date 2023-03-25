import { Context } from "cloudworker-router";
import { Env } from "../types/Env";
import { User } from "../models/User";
import { PasswordlessGrantTypeParams, TokenResponse } from "../types/Token";
import { TokenFactory } from "../services/token-factory";
import { getCertificate } from "../models/Certificate";

export default async function passwordlessGrant(
  ctx: Context<Env>,
  params: PasswordlessGrantTypeParams
): Promise<TokenResponse | null> {
  const user = User.getInstance(ctx.env.USER, params.username);

  const validCode = await user.validateAuthenticationCode.query(params.otp);

  if (!validCode) {
    throw new Error("Invalid code");
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
