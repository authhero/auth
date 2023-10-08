import { nanoid } from "nanoid";
import { CreateTenantParams } from "../../interfaces/Tenants";
import { Tenant } from "../../../types";

export function createTenant(tenants: Tenant[]) {
  return async (params: CreateTenantParams) => {
    const tenant = {
      ...params,
      id: nanoid(),
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
    };

    tenants.push(tenant);

    return tenant;
  };
}
