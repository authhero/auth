import { Kysely } from "kysely";
import { Database } from "../../../types";

export function remove(db: Kysely<Database>) {
  return async (tenant_id: string, hook_id: string): Promise<boolean> => {
    const result = await db
      .deleteFrom("hooks")
      .where("hooks.tenant_id", "=", tenant_id)
      .where("hooks.hook_id", "=", hook_id)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  };
}
