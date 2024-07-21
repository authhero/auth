import { Kysely } from "kysely";
import { createTenant } from "./createTenant";
import { getTenant } from "./getTenant";
import { listTenants } from "./listTenants";
import { updateTenant } from "./updateTenant";
import { removeTenant } from "./removeTenant";
import { TenantsDataAdapter } from "@authhero/adapter-interfaces";
import { Database } from "../db";

export function createTenantsAdapter(db: Kysely<Database>): TenantsDataAdapter {
  return {
    create: createTenant(db),
    get: getTenant(db),
    list: listTenants(db),
    update: updateTenant(db),
    remove: removeTenant(db),
  };
}
