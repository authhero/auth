import { Client } from "../../../types";

export function getClient(clientsStorage: Client[]) {
  return async (id: string): Promise<Client | null> => {
    return clientsStorage.find((client) => client.id === id) || null;
  };
}
