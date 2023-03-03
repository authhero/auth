export interface Env {
  AUTH0_JWKS_URL: string;
  USER: DurableObjectNamespace;
  USER_QUEUE: Queue;
  AUTH_DB: D1Database;
  CERTIFICATES: KVNamespace;
  AUTH_TEMPLATES: R2Bucket;
}
