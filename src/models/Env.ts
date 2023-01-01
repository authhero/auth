export interface Env {
  AUTH0_JWKS_URL: string;
  ADMIN_PASSWORD: string;
  DD_API_KEY: string;
  ISSUER: string;
  JWT_PUBLIC_KEY: string;
  CLIENTS: KVNamespace;
  REFRESH_TOKENS: KVNamespace;
  PERMISSIONS: KVNamespace;
  CERTIFICATES: KVNamespace;
  CODE: DurableObjectNamespace;
}
