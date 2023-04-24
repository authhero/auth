import { OAuthProviderParams } from "../services/oauth2-client";

export interface OauthProvider extends OAuthProviderParams {
  name: string;
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
