export enum GrantType {
  RefreshToken = "refresh_token",
  AuthorizationCode = "authorization_code",
  ClientCredential = "client_credentials",
  Passwordless = "passwordless",
  Password = "password",
}

export type TokenParams =
  | RefreshTokenGrantTypeParams
  | AuthorizationCodeGrantTypeParams
  | PKCEAuthorizationCodeGrantTypeParams
  | ClientCredentialGrantTypeParams
  | PasswordGrantTypeParams;

interface RefreshTokenGrantTypeParams {
  grant_type: GrantType.RefreshToken;
  refresh_token: string;
  client_id: string;
}

export interface AuthorizationCodeGrantTypeParams {
  grant_type: GrantType.AuthorizationCode;
  code: string;
  client_secret: string;
  client_id: string;
}

export interface PKCEAuthorizationCodeGrantTypeParams {
  grant_type: GrantType.AuthorizationCode;
  code: string;
  code_verifier: string;
  client_id?: string;
  redirect_uri: string;
}

export interface ClientCredentialGrantTypeParams {
  grant_type: GrantType.ClientCredential;
  scope?: string;
  client_secret: string;
  client_id: string;
  audience?: string;
}

export interface PasswordGrantTypeParams {
  grant_type: GrantType.Password;
  username: string;
  password: string;
  client_id: string;
  audience?: string;
  scope?: string;
}

export interface TokenResponse {
  access_token: string;
  id_token?: string;
  scope?: string;
  state?: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

export interface CodeResponse {
  code: string;
  state?: string;
}
