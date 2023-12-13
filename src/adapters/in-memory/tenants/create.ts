import { nanoid } from "nanoid";
import { CreateTenantParams } from "../../interfaces/Tenants";
import { Tenant } from "../../../types";

export function createTenant(tenants: Tenant[]) {
  return async (params: CreateTenantParams) => {
    const tenant = {
      id: nanoid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...params,
    };

    tenants.push(tenant);

    return tenant;
  };
}
