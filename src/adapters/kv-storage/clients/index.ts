import { getClient } from "../../../services/clients";
import { Env } from "../../../types";

export function createClientsAdapter(env: Env) {
  return {
    get: (id: string) => getClient(env, id),
  };
}
