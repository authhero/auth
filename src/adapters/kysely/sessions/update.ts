import { Kysely } from "kysely";
import { Database } from "../db";

export function update(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    id: string,
    session: { used_at: string },
  ) => {
    const results = await db
      .updateTable("sessions")
      .set(session)
      .where("tenant_id", "=", tenant_id)
      .where("sessions.id", "=", id)
      .where("sessions.deleted_at", "is", null)
      .execute();

    return !!results.length;
  };
}
