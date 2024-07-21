import { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { Database } from "../../../types";
import { CreateTenantParams, Tenant } from "@authhero/adapter-interfaces";

export function createTenant(db: Kysely<Database>) {
  return async (params: CreateTenantParams): Promise<Tenant> => {
    const tenant: Tenant = {
      id: params.id || nanoid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...params,
    };

    await db.insertInto("tenants").values(tenant).execute();

    return tenant;
  };
}
