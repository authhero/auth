import { TenantsDataAdapter } from "../../../adapters/interfaces/Tenants";
import { Tenant } from "../../../types";
import { createTenant } from "./create";
import { listTenants } from "./list";
import { getTenant } from "./get";
import { updateTenant } from "./update";

export function createTenantsAdapter(): TenantsDataAdapter {
  const tenants: Tenant[] = [];

  return {
    create: createTenant(tenants),
    get: getTenant(tenants),
    list: listTenants(tenants),
    update: updateTenant(tenants),
  };
}
