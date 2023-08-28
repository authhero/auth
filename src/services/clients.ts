import { Env } from "../types";
import {
  Client,
  ClientSchema,
  ConnectionSchema,
  PartialClientSchema,
} from "../types/Client";
import { getDefaultSettings } from "../models/DefaultSettings";

export async function getClient(env: Env, clientId: string): Promise<Client> {
  const clientString = await env.CLIENTS.get<string>(clientId);

  if (!clientString) {
    throw new Error("Client not found");
  }

  const client = PartialClientSchema.parse(JSON.parse(clientString));
  const defaultSettings = getDefaultSettings(env);

  const connections = client.connections
    .map((connection) => {
      const defaultConnection =
        defaultSettings?.connections?.find((c) => c.name === connection.name) ||
        {};

      try {
        return ConnectionSchema.parse({
          ...defaultConnection,
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
    allowedWebOrigins: [...client.allowedLogoutUrls, "http://localhost:8787"],
    allowedCallbackUrls: [
      ...client.allowedCallbackUrls,
      "http://localhost:8787/u/info",
    ],
    connections,
    domains: [...client.domains, ...(defaultSettings.domains || [])],
  });
}
