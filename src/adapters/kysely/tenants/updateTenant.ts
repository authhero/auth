import { Database, Tenant } from "../../../types";
import { Kysely } from "kysely";

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
