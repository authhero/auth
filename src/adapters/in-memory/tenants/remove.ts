import { Tenant } from "../../../types";

export function removeTenant(tenants: Tenant[]) {
  return async (tenant_id: string): Promise<boolean> => {
    const index = tenants.findIndex((tenant) => tenant.id === tenant_id);

    if (index === -1) return false;

    tenants.splice(index, 1);

    return true;
  };
}
