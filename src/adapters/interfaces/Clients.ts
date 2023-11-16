import { Client } from "../../types";

export interface ClientsAdapter {
  get: (id: string) => Promise<Client | null>;
  // Temporary solution for testing
  create?: (client: Client) => Promise<void>;
}
