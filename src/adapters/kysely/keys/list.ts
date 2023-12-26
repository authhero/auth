import { Database } from "../../../types";
import { Kysely } from "kysely";

export function list(db: Kysely<Database>) {
  return async () => {
    const keys = await db.selectFrom("keys").selectAll().execute();

    return keys;
  };
}
