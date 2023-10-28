import { Env } from "../types/Env";
import { PasswordlessGrantTypeParams, TokenResponse } from "../types/Token";
import { getCertificate } from "../models/Certificate";
import { TokenFactory } from "../services/token-factory";
import { getClient } from "../services/clients";
import { getId } from "../models";

export async function passwordlessGrant(
  env: Env,
  params: PasswordlessGrantTypeParams,
): Promise<TokenResponse> {
  const client = await getClient(env, params.client_id);
  const email = params.username.toLocaleLowerCase();

  const user = env.userFactory.getInstanceByName(
    getId(client.tenant_id, email),
  );

  const profile = await user.validateAuthenticationCode.mutate({
    code: params.otp,
    tenantId: client.tenant_id,
    email,
  });

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
