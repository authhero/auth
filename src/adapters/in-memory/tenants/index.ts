import { TenantsDataAdapter } from "../../../adapters/interfaces/Tenants";
import { Tenant } from "../../../types";
import { createTenant } from "./create";
import { listTenants } from "./list";

export function createTenantsAdapter(): TenantsDataAdapter {
  const tenants: Tenant[] = [];

  return {
    create: createTenant(tenants),
    list: listTenants(tenants),
  };
}
