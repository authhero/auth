import { Env } from "../types/Env";
import { PasswordlessGrantTypeParams, TokenResponse } from "../types/Token";
import { getCertificate } from "../models/Certificate";
import { TokenFactory } from "../services/token-factory";
import { getClient } from "../services/clients";

export async function passwordlessGrant(
  env: Env,
  params: PasswordlessGrantTypeParams,
): Promise<TokenResponse> {
  const user = env.userFactory.getInstanceByName(params.username);

  const client = await getClient(env, params.client_id);

  const profile = await user.validateAuthenticationCode.mutate({
    code: params.otp,
    tenantId: client.tenantId,
    email: params.username,
  });

  const certificate = await getCertificate(env);
  const tokenFactory = new TokenFactory(
    certificate.privateKey,
    certificate.kid,
  );

  const token = await tokenFactory.createAccessToken({
    scope: params.scope || "",
    sub: profile.id,
    iss: env.ISSUER,
  });

  return {
    access_token: token,
    token_type: "bearer",
    expires_in: 86400,
  };
}
