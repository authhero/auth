import { Database } from "../../../types";
import { Kysely } from "kysely";

export function revoke(db: Kysely<Database>) {
  return async (kid: string, revoke_at: Date) => {
    const results = await db
      .updateTable("keys")
      .set({ revoked_at: revoke_at.toISOString() })
      .where("kid", "=", kid)
      .execute();

    return !!results.length;
  };
}
