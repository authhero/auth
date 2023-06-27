import { Env } from "../types/Env";
import { PasswordlessGrantTypeParams, TokenResponse } from "../types/Token";
import { getCertificate } from "../models/Certificate";

export async function passwordlessGrant(
  env: Env,
  params: PasswordlessGrantTypeParams
): Promise<TokenResponse | null> {
  const user = env.userFactory.getInstanceByName(params.username);

  const validCode = await user.validateAuthenticationCode.mutate(params.otp);

  if (!validCode) {
    throw new Error("Invalid code");
  }

  const certificate = await getCertificate(env);
  const tokenFactory = new env.TokenFactory(
    certificate.privateKey,
    certificate.kid
  );

  const token = await tokenFactory.createAccessToken({
    scopes: params.scope?.split(" ") ?? [],
    userId: params.username,
    iss: env.ISSUER,
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
