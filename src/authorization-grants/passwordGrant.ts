import { Context } from "cloudworker-router";
import { Env } from "../types/Env";
import { User } from "../models/User";
import { PasswordGrantTypeParams, TokenResponse } from "../types/Token";
import { TokenFactory } from "../services/token-factory";
import { getCertificate } from "../models/Certificate";

export async function passwordGrant(
  ctx: Context<Env>,
  params: PasswordGrantTypeParams
): Promise<TokenResponse | null> {
  const user = User.getInstanceByName(ctx.env.USER, params.username);

  const validatePassword = await user.validatePassword.query(params.password);

  if (!validatePassword) {
    throw new Error("Incorrect password");
  }

  const certificate = await getCertificate(ctx);
  const tokenFactory = new TokenFactory(
    certificate.privateKey,
    certificate.kid
  );

  const token = await tokenFactory.createAccessToken({
    scopes: params.scope?.split(" ") ?? [],
    userId: params.username,
    iss: ctx.env.AUTH_DOMAIN_URL,
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
