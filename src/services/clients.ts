import { Env } from "../types";
import {
  Client,
  ClientSchema,
  ConnectionSchema,
  PartialClientSchema,
} from "../types/Client";
import { DefaultSettings, getDefaultSettings } from "../models/DefaultSettings";

// Thsese default settings are static and don't contain any keys
const defaultSettings: DefaultSettings = {
  connections: [
    {
      name: "google-oauth2",
      scope: "email profile",
      authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      token_endpoint: "https://oauth2.googleapis.com/token",
      response_type: "code",
      response_mode: "query",
    },
    {
      name: "facebook",
      scope: "email public_profile openid",
      authorization_endpoint: "https://www.facebook.com/dialog/oauth",
      token_endpoint: "https://graph.facebook.com/oauth/access_token",
    },
    {
      name: "apple",
      scope: "name email",
      authorization_endpoint: "https://appleid.apple.com/auth/authorize",
      token_endpoint: "https://appleid.apple.com/auth/token",
      response_mode: "form_post",
      response_type: "code",
    },
  ],
};

export async function getClient(env: Env, clientId: string): Promise<Client> {
  const clientString = await env.CLIENTS.get<string>(clientId);

  if (!clientString) {
    throw new Error("Client not found");
  }

  // here we need the same fix as AUTH_CLIENTs KV storage still has modified_at keys for nested connections
  const clientRawObj = JSON.parse(clientString);

  const clientPatchedObj = {
    ...clientRawObj,
    connections: clientRawObj.connections.map((connection: any) => ({
      ...connection,
      updated_at: connection.updated_at || connection.modified_at,
    })),
  };

  const client = PartialClientSchema.parse(clientPatchedObj);
  // These default settings are fetched from the env variables
  const envDefaultSettings = getDefaultSettings(env);

  const connections = client.connections
    .map((connection) => {
      const envDefaultConnection =
        envDefaultSettings?.connections?.find(
          (c) => c.name === connection.name,
        ) || {};
      const defaultConnection =
        defaultSettings?.connections?.find((c) => c.name === connection.name) ||
        {};

      try {
        return ConnectionSchema.parse({
          ...defaultConnection,
          ...envDefaultConnection,
          ...connection,
        });
      } catch (err) {
        if (err instanceof Error) {
          console.log(err.message);
        }
        return null;
      }
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
