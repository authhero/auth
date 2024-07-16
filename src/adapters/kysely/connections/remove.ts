import { Kysely } from "kysely";
import { Database } from "../../../types";

export function remove(db: Kysely<Database>) {
  return async (tenant_id: string, connection_id: string): Promise<boolean> => {
    const result = await db
      .deleteFrom("connections")
      .where("connections.tenant_id", "=", tenant_id)
      .where("connections.id", "=", connection_id)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  };
}
