import { Client } from "../../../types";

export function createClient(clientsStorage: Client[]) {
  return async (client: Client): Promise<void> => {
    clientsStorage.push(client);
  };
}
