import { ClientsAdapter } from "../../interfaces/Clients";
import { Client } from "../../../types";
import { getClient } from "./getClient";
import { createClient } from "./createClient";

export function createClientsAdapter(clientStorage: Client[]): ClientsAdapter {
  return {
    get: getClient(clientStorage),
    create: createClient(clientStorage),
  };
}
