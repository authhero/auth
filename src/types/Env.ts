import { IOAuth2ClientFactory } from "../services/oauth2-client";
import { DataAdapters } from "../adapters/interfaces";
import { VendorSettings } from "./sql";
import type { Client } from "./Client";
import type { EmailOptions } from "../services/email/EmailOptions";

export type Env = {
  ISSUER: string;
  DD_API_KEY: string;
  JWKS_URL: string;
  LOGIN2_URL: string;
  IMAGE_PROXY_URL: string;
  DATABASE_HOST: string;
  DATABASE_PASSWORD: string;
  DATABASE_USERNAME: string;
  TOKEN_SERVICE: Fetcher;
  AUTH_URL: string;
  // Can we remove this? only used by src/routes/login - what is this?
  AUTH_TEMPLATES: R2Bucket;
  // what is this?
  EMAIL_TEMPLATES: R2Bucket;
  READ_PERMISSION?: string;
  WRITE_PERMISSION?: string;
  oauth2ClientFactory: IOAuth2ClientFactory;
  data: DataAdapters;
  sendEmail: (client: Client, email: EmailOptions) => Promise<void>;
};
