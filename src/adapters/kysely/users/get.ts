import { Database, SqlUser } from "../../../types";
import { Kysely } from "kysely";
import { fixBooleans } from "./booleans";

export function get(db: Kysely<Database>) {
  return async (tenantId: string, id: string): Promise<SqlUser | null> => {
    const user = await db
      .selectFrom("users")
      .where("users.tenant_id", "=", tenantId)
      .where("users.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!user) {
      return null;
    }

    return fixBooleans(user);
  };
}
