import { getClient } from "../../../services/clients";
import { Env } from "../../../types";
import { Client } from "../../../types/Client";

export function createClientsAdapter(env: Env) {
  return {
    // how can this have worked? It is calling itself on the first line... calling itself
    get: (id: string) => getClient(env, id),
    //  env.data.clients.get calls this right? Am I confused?
  };
}
