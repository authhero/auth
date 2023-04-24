import { IOAuth2ClientFactory } from "../services/oauth2-client";

export interface Env {
  AUTH0_JWKS_URL: string;
  AUTH_DOMAIN_URL: string;
  USER: DurableObjectNamespace;
  STATE: DurableObjectNamespace;
  USER_QUEUE: Queue;
  AUTH_DB: D1Database;
  CERTIFICATES: KVNamespace;
  AUTH_TEMPLATES: R2Bucket;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  OAUTH2_CLIENT_FACTORY: IOAuth2ClientFactory;
}
