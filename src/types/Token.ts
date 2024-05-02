import { z } from "zod";

export enum GrantType {
  RefreshToken = "refresh_token",
  AuthorizationCode = "authorization_code",
  ClientCredential = "client_credentials",
  Passwordless = "passwordless",
  Password = "password",
}

const grantTypeSchema = z.nativeEnum(GrantType);

const refreshTokenGrantTypeParamsSchema = z.object({
  grant_type: grantTypeSchema.refine((val) => val === GrantType.RefreshToken),
  refresh_token: z.string(),
  client_id: z.string(),
});

const authorizationCodeGrantTypeParamsSchema = z.object({
  grant_type: grantTypeSchema.refine(
    (val) => val === GrantType.AuthorizationCode,
  ),
  code: z.string(),
  client_secret: z.string(),
  client_id: z.string(),
});

export type AuthorizationCodeGrantTypeParams = z.infer<
  typeof authorizationCodeGrantTypeParamsSchema
>;

const pkceAuthorizationCodeGrantTypeParamsSchema = z.object({
  grant_type: grantTypeSchema.refine(
    (val) => val === GrantType.AuthorizationCode,
  ),
  code: z.string(),
  code_verifier: z.string(),
  client_id: z.string().optional(),
  redirect_uri: z.string(),
});

export type PKCEAuthorizationCodeGrantTypeParams = z.infer<
  typeof pkceAuthorizationCodeGrantTypeParamsSchema
>;

const clientCredentialGrantTypeParamsSchema = z.object({
  grant_type: grantTypeSchema.refine(
    (val) => val === GrantType.ClientCredential,
  ),
  scope: z.string().optional(),
  client_secret: z.string(),
  client_id: z.string(),
  audience: z.string().optional(),
});

export type ClientCredentialsGrantTypeParams = z.infer<
  typeof clientCredentialGrantTypeParamsSchema
>;

const passwordGrantTypeParamsSchema = z.object({
  grant_type: grantTypeSchema.refine((val) => val === GrantType.Password),
  username: z.string(),
  password: z.string(),
  client_id: z.string(),
  audience: z.string().optional(),
  scope: z.string().optional(),
});

const tokenResponseSchema = z.object({
  access_token: z.string(),
  id_token: z.string().optional(),
  scope: z.string().optional(),
  state: z.string().optional(),
  refresh_token: z.string().optional(),
  token_type: z.string(),
  expires_in: z.number(),
});
export type TokenResponse = z.infer<typeof tokenResponseSchema>;

const codeResponseSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});
export type CodeResponse = z.infer<typeof codeResponseSchema>;

export {
  authorizationCodeGrantTypeParamsSchema,
  pkceAuthorizationCodeGrantTypeParamsSchema,
  clientCredentialGrantTypeParamsSchema,
};
