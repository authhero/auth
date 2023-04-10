export enum AuthorizationResponseType {
  TOKEN_ID_TOKEN = "token id_token",
  IMPLICIT = "implicit",
  CODE = "code",
}

export enum AuthorizationResponseMode {
  QUERY = "query",
}

export enum CodeChallengeMethod {
  S265 = "S256",
  plain = "plain",
}

export interface AuthParams {
  clientId: string;
  responseType?: AuthorizationResponseType;
  responseMode?: AuthorizationResponseMode;
  redirectUri: string;
  audience?: string;
  state?: string;
  nonce?: string;
  scope?: string;
  codeChallengeMethod?: CodeChallengeMethod;
  codeChallenge?: string;
}
