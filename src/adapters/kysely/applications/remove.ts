import { Kysely } from "kysely";
import { Database } from "../db";

export function remove(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    application_id: string,
  ): Promise<boolean> => {
    const result = await db
      .deleteFrom("applications")
      .where("applications.tenant_id", "=", tenant_id)
      .where("applications.id", "=", application_id)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  };
}
