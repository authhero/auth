import { Client, PartialClient } from "../../types";

export interface ClientsAdapter {
  get: (id: string) => Promise<Client | null>;
  // Temporary solution for testing
  create?: (client: PartialClient) => Promise<void>;
}
