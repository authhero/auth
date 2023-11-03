import { Database, SqlUser } from "../../../types";
import { Kysely } from "kysely";

export function get(db: Kysely<Database>) {
  return async (tenantId, id: string): Promise<SqlUser | null> => {
    const user = await db
      .selectFrom("users")
      .where("users.tenant_id", "=", tenantId)
      .where("users.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    return user || null;
  };
}
