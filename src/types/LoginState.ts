export interface LoginState {
  username?: string;
  state?: string;
  scope?: string;
  clientId: string;
  grantType?: string;
}
