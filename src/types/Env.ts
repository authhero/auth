import { IOAuth2ClientFactory } from "../services/oauth2-client";

export interface Env {
  AUTH0_JWKS_URL: string;
  AUTH_DOMAIN_URL: string;
  USER: DurableObjectNamespace;
  STATE: DurableObjectNamespace;
  USERS_QUEUE: Queue;
  AUTH_DB: D1Database;
  CERTIFICATES: KVNamespace;
  AUTH_TEMPLATES: R2Bucket;
  OAUTH2_CLIENT_FACTORY: IOAuth2ClientFactory;
}
