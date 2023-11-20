import { Tenant } from "../../../types";

export function getTenant(tenants: Tenant[]) {
  return async (id: string) => {
    return tenants.find((tenant) => tenant.id === id);
  };
}
