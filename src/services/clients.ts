import { Env } from "../types/Env";
import { ClientSchema } from "../types/Client";

export async function getClient(env: Env, clientId: string) {
  const client = await env.CLIENTS.get<string>(clientId);

  if (!client) {
    throw new Error("Client not found");
  }
  return ClientSchema.parse(JSON.parse(client));
}
