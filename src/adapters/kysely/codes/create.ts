import { Code } from "@authhero/adapter-interfaces";
import { Database } from "../../../types";
import { Kysely } from "kysely";

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
