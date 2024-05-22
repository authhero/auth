import { z } from "zod";

export enum AuthorizationResponseType {
  TOKEN = "token",
  TOKEN_ID_TOKEN = "token id_token",
  CODE = "code",
}

export enum AuthorizationResponseMode {
  QUERY = "query",
  FRAGMENT = "fragment",
  FORM_POST = "form_post",
  WEB_MESSAGE = "web_message",
}

export enum CodeChallengeMethod {
  S265 = "S256",
  plain = "plain",
}

export const authParamsSchema = z.object({
  client_id: z.string(),
  vendor_id: z.string().optional(),
  response_type: z.nativeEnum(AuthorizationResponseType).optional(),
  response_mode: z.nativeEnum(AuthorizationResponseMode).optional(),
  redirect_uri: z.string().optional(),
  audience: z.string().optional(),
  state: z.string().optional(),
  nonce: z.string().optional(),
  scope: z.string().optional(),
  code_challenge_method: z.nativeEnum(CodeChallengeMethod).optional(),
  code_challenge: z.string().optional(),
  username: z.string().optional(),
  auth0Client: z.string().optional(),
});

export type AuthParams = z.infer<typeof authParamsSchema>;
