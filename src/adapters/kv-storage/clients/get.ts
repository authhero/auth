import { Client } from "../../../types";
import { Certificate } from "../../../models";

export function get(namespace: KVNamespace<string>) {
  return async (id: string): Promise<Client | null> => {
    const clientJson = await namespace.get(id);

    if (!clientJson) {
      return null;
    }

    return JSON.parse(clientJson);
  };
}
