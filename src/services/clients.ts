import { Env } from "../types";
import { Client, ClientSchema, PartialClientSchema } from "../types/Client";
import { getDefaultSettings } from "../models/DefaultSettings";

export async function getClient(env: Env, clientId: string): Promise<Client> {
  const clientString = await env.CLIENTS.get<string>(clientId);

  if (!clientString) {
    throw new Error("Client not found");
  }

  console.log("got here");
  const client = PartialClientSchema.parse(JSON.parse(clientString));
  console.log("got client: " + JSON.stringify(client));
  const defaultSettings = getDefaultSettings(env);
  console.log("got defaultSettings: " + JSON.stringify(defaultSettings));

  const connections = client.connections.map((connection) => {
    const defaultConnection =
      defaultSettings?.connections?.find((c) => c.name === connection.name) ||
      {};

    return {
      ...defaultConnection,
      ...connection,
    };
  });

  console.log(
    "Client: " +
      JSON.stringify({
        ...client,
        connections,
        domains: [...client.domains, ...(defaultSettings.domains || [])],
      }),
  );

  return ClientSchema.parse({
    ...client,
    connections,
    domains: [...client.domains, ...(defaultSettings.domains || [])],
  });
}
