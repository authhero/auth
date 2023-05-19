import { Context } from "cloudworker-router";
import { Env } from "../types/Env";
import { PasswordGrantTypeParams, TokenResponse } from "../types/Token";
import { getCertificate } from "../models/Certificate";

export async function passwordGrant(
  ctx: Context<Env>,
  params: PasswordGrantTypeParams
): Promise<TokenResponse | null> {
  const user = ctx.env.userFactory.getInstanceByName(params.username);

  const validatePassword = await user.validatePassword.mutate(params.password);

  if (!validatePassword) {
    throw new Error("Incorrect password");
  }

  // TODO: clean this up and use the genrate-auth-response function
  const certificate = await getCertificate(ctx.env);
  const tokenFactory = new ctx.env.TokenFactory(
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
