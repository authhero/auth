import { nanoid } from "nanoid";
import { CreateTenantParams } from "../../interfaces/Tenants";
import { Tenant } from "../../../types";

export function createTenant(tenants: Tenant[]) {
  return async (params: CreateTenantParams) => {
    const tenant = {
      // these don't work on cloudflare
      // id: nanoid(),
      //  lol - TIL "Error: Some functionality, such as asynchronous I/O, timeouts, and generating random values, can only be performed while handling a request."
      // create deterministic id for testing
      id: `tenant-${tenants.length + 1}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...params,
    };

    tenants.push(tenant);

    return tenant;
  };
}
