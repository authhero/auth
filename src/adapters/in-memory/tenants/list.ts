import { Tenant } from "../../../types";

export function listTenants(tenants: Tenant[]) {
  return async () => {
    return {
      tenants,
    };
  };
}
