import { ClientsAdapter } from "../../interfaces/Clients";
import { Application, Tenant, SqlConnection } from "../../../types";
import { getClient } from "./getClient";
import { createClient } from "./createClient";

export function createClientsAdapter(
  applications: Application[],
  tenants: Tenant[],
  connections: SqlConnection[],
): ClientsAdapter {
  // remove this
  const clientStorage: any = [];
  return {
    get: getClient(applications, tenants, connections),
    // TODO - remove this! no longer want it
    create: createClient(clientStorage),
  };
}
