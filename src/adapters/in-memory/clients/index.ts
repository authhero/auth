import { ClientsAdapter } from "../../interfaces/Clients";
import { Application, Tenant, SqlConnection } from "../../../types";
import { getClient } from "./getClient";
import { createClient } from "./createClient";

export function createClientsAdapter(
  applications: Application[],
  tenants: Tenant[],
  connections: SqlConnection[],
): ClientsAdapter {
  return {
    get: getClient(applications, tenants, connections),
  };
}
