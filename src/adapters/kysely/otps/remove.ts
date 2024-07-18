import { Database } from "../../../types";
import { Kysely } from "kysely";

export function remove(db: Kysely<Database>) {
  return async (tenant_id: string, id: string) => {
    const result = await db
      .updateTable("otps")
      .set({
        used_at: new Date().toISOString(),
      })
      .where("otps.tenant_id", "=", tenant_id)
      .where("otps.id", "=", id)
      .execute();

    return result.length > 0;
  };
}
