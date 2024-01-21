import { Client, PartialClient } from "../../../types";

export function createClient(clientsStorage: PartialClient[]) {
  return async (client: PartialClient): Promise<void> => {
    clientsStorage.push(client);
  };
}
