import { getDb } from "../../../services/db";
import { Env } from "../../../types";
import { TenantsDataAdapter } from "../../interfaces/Tenants";
import { createTenant } from "./createTenant";
import { listTenants } from "./listTenants";

export function createTenantsAdapter(env: Env): TenantsDataAdapter {
  const db = getDb(env);

  return {
    create: createTenant(db),
    list: listTenants(db),
  };
}
