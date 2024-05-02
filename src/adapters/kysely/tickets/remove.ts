import { Database } from "../../../types";
import { Kysely } from "kysely";

export function remove(db: Kysely<Database>) {
  return async (tenant_id: string, id: string) => {
    await db
      .updateTable("tickets")
      .set({
        used_at: new Date().toISOString(),
      })
      .where("tickets.tenant_id", "=", tenant_id)
      .where("tickets.id", "=", id)
      .execute();
  };
}
