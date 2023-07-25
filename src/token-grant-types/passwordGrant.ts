import { Context } from "cloudworker-router";
import { Env } from "../types/Env";
import { PasswordGrantTypeParams, TokenResponse } from "../types/Token";
import { getCertificate } from "../models/Certificate";
import { TokenFactory } from "../services/token-factory";
import { getClient } from "../services/clients";

export async function passwordGrant(
  ctx: Context<Env>,
  params: PasswordGrantTypeParams,
): Promise<TokenResponse> {
  const user = ctx.env.userFactory.getInstanceByName(params.username);

  const client = await getClient(ctx.env, params.client_id);

  const profile = await user.validatePassword.mutate({
    password: params.password,
    tenantId: client.tenantId,
    email: params.username,
  });

  const certificate = await getCertificate(ctx.env);
  const tokenFactory = new TokenFactory(
    certificate.privateKey,
    certificate.kid,
  );

  const token = await tokenFactory.createAccessToken({
    scope: params.scope || "",
    sub: profile.id,
    iss: ctx.env.ISSUER,
  });

  return {
    access_token: token,
    token_type: "bearer",
    expires_in: 86400,
  };
}
