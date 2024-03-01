import { Kysely } from "kysely";
import { Database, SqlUser, PostUsersBody } from "../../../types";

export function unlink(db: Kysely<Database>) {
  return async (tenant_id: string, id: string): Promise<boolean> => {
    const unsafeTypeUser: any = { linked_to: null };

    const results = await db
      .updateTable("users")
      .set(unsafeTypeUser)
      .where("users.tenant_id", "=", tenant_id)
      .where("users.id", "=", id)
      .execute();

    return results.length === 1;
  };
}
