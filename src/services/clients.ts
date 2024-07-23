import { Env } from "../types";
import { DefaultSettings, getDefaultSettings } from "../models/DefaultSettings";
import { HTTPException } from "hono/http-exception";
import {
  Client,
  ClientSchema,
  PartialClientSchema,
} from "@authhero/adapter-interfaces";

// Thsese default settings are static and don't contain any keys
const defaultSettings: DefaultSettings = {
  connections: [
    {
      name: "google-oauth2",
      scope: "email profile",
      authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      token_endpoint: "https://oauth2.googleapis.com/token",
      token_exchange_basic_auth: true,
      response_type: "code",
      response_mode: "query",
    },
    {
      name: "facebook",
      scope: "email public_profile openid",
      authorization_endpoint: "https://www.facebook.com/dialog/oauth",
      token_endpoint: "https://graph.facebook.com/oauth/access_token",
      token_exchange_basic_auth: true,
    },
    {
      name: "apple",
      scope: "name email",
      authorization_endpoint: "https://appleid.apple.com/auth/authorize",
      token_endpoint: "https://appleid.apple.com/auth/token",
      token_exchange_basic_auth: false,
      response_mode: "form_post",
      response_type: "code",
    },
  ],
};

export async function getClient(env: Env, clientId: string): Promise<Client> {
  // TODO: we dont't have a tenant id here so we'll pass a wildcard for now. Use subdomains for
  const clientRawObj = await env.data.clients.get(clientId);
  if (!clientRawObj) {
    throw new HTTPException(403, { message: "Client not found" });
  }

  const client = PartialClientSchema.parse(clientRawObj);
  const envDefaultSettings = await getDefaultSettings(env);

  const connections = client.connections
    .map((connection) => {
      const defaultConnection =
        defaultSettings?.connections?.find((c) => c.name === connection.name) ||
        {};

      const envDefaultConnection =
        envDefaultSettings?.connections?.find(
          (c) => c.name === connection.name,
        ) || {};

      const mergedConnection = {
        ...defaultConnection,
        ...envDefaultConnection,
        ...connection,
      };

      return mergedConnection;
    })
    .filter((c) => c);

  return ClientSchema.parse({
    ...client,
    allowed_web_origins: [
      ...(envDefaultSettings.allowed_web_origins || []),
      ...client.allowed_web_origins,
      `${env.ISSUER}u/login`,
    ],
    allowed_logout_urls: [
      ...(envDefaultSettings.allowed_logout_urls || []),
      ...client.allowed_logout_urls,
      env.ISSUER,
    ],
    allowed_callback_urls: [
      ...(envDefaultSettings.allowed_callback_urls || []),
      ...client.allowed_callback_urls,
      `${env.ISSUER}u/info`,
    ],
    connections,
    domains: [...client.domains, ...(envDefaultSettings.domains || [])],
    tenant: {
      ...envDefaultSettings.tenant,
      ...client.tenant,
    },
  });
}
