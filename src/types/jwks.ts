import { z } from "zod";

export const jwksSchema = z.object({
  alg: z.string(),
  e: z.string(),
  kid: z.string(),
  kty: z.string(),
  n: z.string(),
  use: z.string().optional(),
});

export const jwksKeySchema = z.object({
  keys: z.array(jwksSchema),
});

export const openIDConfigurationSchema = z.object({
  issuer: z.string(),
  authorization_endpoint: z.string(),
  token_endpoint: z.string(),
  device_authorization_endpoint: z.string(),
  userinfo_endpoint: z.string(),
  mfa_challenge_endpoint: z.string(),
  jwks_uri: z.string(),
  registration_endpoint: z.string(),
  revocation_endpoint: z.string(),
  scopes_supported: z.array(z.string()),
  response_types_supported: z.array(z.string()),
  code_challenge_methods_supported: z.array(z.string()),
  response_modes_supported: z.array(z.string()),
  subject_types_supported: z.array(z.string()),
  id_token_signing_alg_values_supported: z.array(z.string()),
  token_endpoint_auth_methods_supported: z.array(z.string()),
  claims_supported: z.array(z.string()),
  request_uri_parameter_supported: z.boolean(),
  request_parameter_supported: z.boolean(),
  token_endpoint_auth_signing_alg_values_supported: z.array(z.string()),
});
