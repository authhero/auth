import { IOAuth2ClientFactory } from "../services/oauth2-client";
import { StateClient, UserClient } from "../models";
import { QueueMessage } from "../services/events";

export interface StateRouterFactory {
  (name: string): StateClient;
}

export interface ClientFactory<ClientType> {
  getInstanceById: (id: string) => ClientType;
  getInstanceByName: (name: string) => ClientType;
}

export interface Env {
  ISSUER: string;
  DD_API_KEY: string;
  JWKS_URL: string;
  DATABASE_HOST: string;
  DATABASE_PASSWORD: string;
  DATABASE_USERNAME: string;
  TOKEN_SERVICE: Fetcher;
  USER: DurableObjectNamespace;
  STATE: DurableObjectNamespace;
  USERS_QUEUE: Queue<QueueMessage>;
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
  userFactory: ClientFactory<UserClient>;
}
