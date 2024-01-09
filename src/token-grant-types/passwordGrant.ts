import { Env } from "../types/Env";
import { PasswordGrantTypeParams, TokenResponse } from "../types/Token";
import { getClient } from "../services/clients";

export async function passwordGrant(
  env: Env,
  params: PasswordGrantTypeParams,
): Promise<TokenResponse> {
  const client = await getClient(env, params.client_id);

  const email = params.username.toLocaleLowerCase();

  throw new Error("Not implemented");
  // const certificate = await getCertificate(env);
  // const tokenFactory = new TokenFactory(
  //   certificate.privateKey,
  //   certificate.kid,
  // );

  // const token = await tokenFactory.createAccessToken({
  //   aud: params.audience,
  //   scope: params.scope || "",
  //   sub: profile.id,
  //   iss: env.ISSUER,
  // });

  // return {
  //   access_token: token,
  //   token_type: "bearer",
  //   expires_in: 86400,
  // };
  // const { tenant_id, id } = profile;
}
