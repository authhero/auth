import { Kysely } from "kysely";
import { Database } from "../db";

export function remove(db: Kysely<Database>) {
  return async (tenant_id: string, user_id: string): Promise<boolean> => {
    // Planetscale has no cascading delete as it has no FK
    // so we manually remove any users first that have linked_to set to this id!
    await db
      .deleteFrom("users")
      .where("users.tenant_id", "=", tenant_id)
      .where("users.linked_to", "=", user_id)
      .execute();

    const results = await db
      .deleteFrom("users")
      .where("users.tenant_id", "=", tenant_id)
      .where("users.user_id", "=", user_id)
      .execute();

    return results.length === 1;
  };
}
