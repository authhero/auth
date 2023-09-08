import { Env } from "../types/Env";
import { PasswordGrantTypeParams, TokenResponse } from "../types/Token";
import { getCertificate } from "../models/Certificate";
import { TokenFactory } from "../services/token-factory";
import { getClient } from "../services/clients";

export async function passwordGrant(
  env: Env,
  params: PasswordGrantTypeParams,
): Promise<TokenResponse> {
  const user = env.userFactory.getInstanceByName(params.username);

  const client = await getClient(env, params.client_id);

  await user.validatePassword.mutate({
    password: params.password,
    tenantId: client.tenantId,
    email: params.username,
  });

  const profile = await user.getProfile.query();

  const certificate = await getCertificate(env);
  const tokenFactory = new TokenFactory(
    certificate.privateKey,
    certificate.kid,
  );

  const token = await tokenFactory.createAccessToken({
    aud: params.audience,
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
