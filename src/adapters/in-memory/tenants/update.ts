import { Tenant } from "../../../types";

export function updateTenant(tenants: Tenant[]) {
  return async (id: string, tenant: Partial<Tenant>) => {
    const index = tenants.findIndex((item) => item.id === id);
    tenants[index] = {
      ...tenants[index],
      ...tenant,
      updated_at: new Date().toISOString(),
    };
  };
}
