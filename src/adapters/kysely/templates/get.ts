import { Database, SqlTemplate } from "../../../types";
import { Kysely } from "kysely";

export function get(db: Kysely<Database>) {
  return async (tenant_id: string, id: string): Promise<string | undefined> => {
    const template = await db
      .selectFrom("templates")
      .where("tenant_id", "=", tenant_id)
      .where("id", "=", id)
      .selectAll()
      .executeTakeFirst();

    return template?.text;
  };
}
