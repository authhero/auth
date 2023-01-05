export enum GrantType {
  RefreshToken = "refresh_token",
  AuthorizationCode = "authorization_code",
  ClientCredential = "client_credentials",
  Passwordless = "passwordless",
}

export type TokenParams =
  | RefreshTokenGrantTypeParams
  | AuthorizationCodeGrantTypeParams
  | ClientCredentialGrantTypeParams
  | PasswordlessGrantTypeParams;

export interface RefreshTokenGrantTypeParams {
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

export interface ClientCredentialGrantTypeParams {
  grant_type: GrantType.ClientCredential;
  scope: string;
  client_secret: string;
  client_id: string;
}

export interface PasswordlessGrantTypeParams {
  grant_type: GrantType.Passwordless;
  scope?: string;
  client_secret?: string;
  username: string;
  otp: string;
  realm: "email";
  audience?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}
