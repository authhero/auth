export interface OauthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  loginUrl: string;
}

export interface Client {
  id: string;
  name: string;
  audience: string;
  issuer: string;
  senderEmail: string;
  senderName: string;
  loginBaseUrl: string;
  oauthProviders: OauthProvider[];
}
