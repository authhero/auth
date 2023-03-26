export interface LoginState {
  username?: string;
  state?: string;
  scope?: string;
  clientId: string;
  responseType?: string;
  redirectUri?: string;
  connection?: string;
}
