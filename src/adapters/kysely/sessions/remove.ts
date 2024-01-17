import { Database } from "../../../types";
import { Kysely } from "kysely";

export function remove(db: Kysely<Database>) {
  return async (tenant_id: string, id: string): Promise<boolean> => {
    const results = await db
      .updateTable("sessions")
      .set({ deleted_at: new Date().toISOString() })
      .where("tenant_id", "=", tenant_id)
      .where("sessions.id", "=", id)
      .where("sessions.deleted_at", "is", null)
      .execute();

    return !!results.length;
  };
}
