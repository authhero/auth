import { getDb } from "../../../services/db";
import { Env } from "../../../types";
import { TenantsDataAdapter } from "../../interfaces/Tenants";
import { createTenant } from "./createTenant";
import { getTenant } from "./getTenant";
import { listTenants } from "./listTenants";
import { updateTenant } from "./updateTenant";

export function createTenantsAdapter(env: Env): TenantsDataAdapter {
  const db = getDb(env);

  return {
    create: createTenant(db),
    get: getTenant(db),
    list: listTenants(db),
    update: updateTenant(db),
  };
}
