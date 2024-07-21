import { Tenant } from "@authhero/adapter-interfaces";
import { Kysely } from "kysely";
import { Database } from "../db";

export function updateTenant(db: Kysely<Database>) {
  return async (id: string, tenant: Partial<Tenant>): Promise<void> => {
    const tenantWithModified = {
      ...tenant,
      id,
      updated_at: new Date().toISOString(),
    };

    await db
      .updateTable("tenants")
      .set(tenantWithModified)
      .where("id", "=", id)
      .execute();
  };
}
