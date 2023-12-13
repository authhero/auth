import { PartialClient } from "../../types";

export interface ClientsAdapter {
  get: (id: string) => Promise<PartialClient | null>;
  // Temporary solution for testing
  create?: (client: PartialClient) => Promise<void>;
}
