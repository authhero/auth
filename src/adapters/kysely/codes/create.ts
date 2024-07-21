import { Code } from "@authhero/adapter-interfaces";
import { Kysely } from "kysely";
import { Database } from "../db";

export function create(db: Kysely<Database>) {
  return async (tenant_id: string, code: Code) => {
    await db
      .insertInto("codes")
      .values({
        ...code,
        tenant_id,
      })
      .execute();
  };
}
