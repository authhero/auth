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
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      responseType: "code",
      responseMode: "query",
    },
    {
      name: "facebook",
      scope: "email public_profile openid",
      authorizationEndpoint: "https://www.facebook.com/dialog/oauth",
      tokenEndpoint: "https://graph.facebook.com/oauth/access_token",
    },
    {
      name: "apple",
      scope: "name email",
      authorizationEndpoint: "https://appleid.apple.com/auth/authorize",
      tokenEndpoint: "https://appleid.apple.com/auth/token",
      responseMode: "form_post",
      responseType: "code",
    },
  ],
};

export async function getClient(env: Env, clientId: string): Promise<Client> {
  const clientString = await env.CLIENTS.get<string>(clientId);

  if (!clientString) {
    throw new Error("Client not found");
  }

  const client = PartialClientSchema.parse(JSON.parse(clientString));
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
    allowedWebOrigins: [...client.allowedWebOrigins, `${env.ISSUER}u/login`],
    allowedLogoutUrls: [...client.allowedLogoutUrls, env.ISSUER],
    allowedCallbackUrls: [...client.allowedCallbackUrls, `${env.ISSUER}u/info`],
    connections,
    domains: [...client.domains, ...(envDefaultSettings.domains || [])],
  });
}
