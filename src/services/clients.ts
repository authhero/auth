import { Env } from "../types";
import { Client, ClientSchema, PartialClientSchema } from "../types/Client";
import { getDefaultSettings } from "../models/DefaultSettings";

export async function getClient(env: Env, clientId: string): Promise<Client> {
  const clientString = await env.CLIENTS.get<string>(clientId);

  if (!clientString) {
    throw new Error("Client not found");
  }

  const client = PartialClientSchema.parse(JSON.parse(clientString));
  const defaultSettings = getDefaultSettings(env);

  const connections = client.connections.map((connection) => {
    const defaultConnection =
      defaultSettings?.connections?.find((c) => c.name === connection.name) ||
      {};

    return {
      ...defaultConnection,
      ...connection,
    };
  });

  return ClientSchema.parse({
    ...client,
    connections,
    domains: [...client.domains, ...(defaultSettings.domains || [])],
  });
}
