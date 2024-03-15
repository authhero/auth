import { Database, OTP } from "../../../types";
import { Kysely } from "kysely";

export function remove(db: Kysely<Database>) {
  return async (tenant_id: string, id: string) => {
    await db
      .updateTable("otps")
      .set({
        used_at: new Date().toISOString(),
      })
      .where("otps.tenant_id", "=", tenant_id)
      .where("otps.id", "=", id)
      .execute();
  };
}
