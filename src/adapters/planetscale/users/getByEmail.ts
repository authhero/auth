import { Database, SqlUser } from "../../../types";
import { Kysely } from "kysely";

export function getByEmail(db: Kysely<Database>) {
  return async (tenantId, email: string): Promise<SqlUser | null> => {
    const user = await db
      .selectFrom("users")
      .where("users.tenant_id", "=", tenantId)
      .where("users.email", "=", email)
      .selectAll()
      .executeTakeFirst();

    return user || null;
  };
}
