import { Database, SqlUser } from "../../../types";
import { Kysely } from "kysely";
import { parseBooleans } from "./booleans";

export function getByEmail(db: Kysely<Database>) {
  return async (tenantId: string, email: string): Promise<SqlUser[]> => {
    const users = await db
      .selectFrom("users")
      .where("users.tenant_id", "=", tenantId)
      .where("users.email", "=", email)
      .selectAll()
      .execute();

    return users.map(parseBooleans);
  };
}
