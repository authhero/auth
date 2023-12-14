import { ClientsAdapter } from "../../interfaces/Clients";
import { Application, Tenant, SqlConnection, SqlDomain } from "../../../types";
import { getClient } from "./getClient";

export function createClientsAdapter(
  applications: Application[],
  tenants: Tenant[],
  connections: SqlConnection[],
  domains: SqlDomain[],
): ClientsAdapter {
  return {
    get: getClient(applications, tenants, connections, domains),
  };
}
