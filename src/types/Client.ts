import { OauthProviderParams } from "../services/oauth2-client";

export interface OauthProvider extends OauthProviderParams {
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
