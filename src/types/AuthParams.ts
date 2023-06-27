export enum AuthorizationResponseType {
  TOKEN = "token",
  TOKEN_ID_TOKEN = "token id_token",
  IMPLICIT = "implicit",
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

export interface AuthParams {
  client_id: string;
  response_type?: AuthorizationResponseType;
  response_mode?: AuthorizationResponseMode;
  redirect_uri?: string;
  audience?: string;
  state?: string;
  nonce?: string;
  scope?: string;
  code_challenge_method?: CodeChallengeMethod;
  code_challenge?: string;
}
