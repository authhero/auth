import { Kysely } from "kysely";
import { Database } from "../db";

export function list(db: Kysely<Database>) {
  return async () => {
    const keys = await db
      .selectFrom("keys")
      .where("revoked_at", "is", null)
      .selectAll()
      .execute();

    return keys;
  };
}
