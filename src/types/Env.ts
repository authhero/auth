import { IOAuth2ClientFactory } from "../services/oauth2-client";
import type { EmailOptions } from "../services/email/EmailOptions";
import { Client, DataAdapters } from "@authhero/adapter-interfaces";

export type Env = {
  ISSUER: string;
  DD_API_KEY: string;
  JWKS_URL: string;
  LOGIN2_URL: string;
  API_URL: string;
  IMAGE_PROXY_URL: string;
  DATABASE_HOST: string;
  DATABASE_PASSWORD: string;
  DATABASE_USERNAME: string;
  TOKEN_SERVICE: Fetcher;
  AUTH_URL: string;
  READ_PERMISSION?: string;
  WRITE_PERMISSION?: string;
  ENVIRONMENT: string;
  oauth2ClientFactory: IOAuth2ClientFactory;
  data: DataAdapters;
  sendEmail: (client: Client, email: EmailOptions) => Promise<void>;
};
