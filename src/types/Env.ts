import { IOAuth2ClientFactory } from "../services/oauth2-client";
import { StateClient } from "../models";
import { DataAdapters } from "../adapters/interfaces";
import { Application, Tenant } from "./sql";

export interface StateRouterFactory {
  (name: string): StateClient;
}

export interface ClientFactory<ClientType> {
  getInstanceById: (id: string) => ClientType;
  getInstanceByName: (name: string) => ClientType;
}

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
  USER: DurableObjectNamespace;
  STATE: DurableObjectNamespace;
  AUTH_DB: D1Database;
  CERTIFICATES: KVNamespace;
  CLIENTS: KVNamespace;
  AUTH_TEMPLATES: R2Bucket;
  EMAIL_TEMPLATES: R2Bucket;
  READ_PERMISSION?: string;
  WRITE_PERMISSION?: string;
  DEFAULT_SETTINGS?: string;
  oauth2ClientFactory: IOAuth2ClientFactory;
  stateFactory: ClientFactory<StateClient>;
  data: DataAdapters;
  hooks: {
    application?: {
      onCreated?: (env: Env, application: Application) => Promise<void>;
    };
    tenant?: {
      onCreated?: (env: Env, tenant: Tenant) => Promise<void>;
    };
  };
};
