import { PartialClient } from "../../types";

export interface ClientsAdapter {
  get: (id: string) => Promise<PartialClient | null>;
}
