export interface AuthParams {
  clientId: string;
  responseType?: string;
  redirectUri: string;
  audience?: string;
  state?: string;
  nonce?: string;
  scope?: string;
}
