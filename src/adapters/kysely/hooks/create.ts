import { Kysely } from "kysely";
import { Database } from "../../../types";
import { nanoid } from "nanoid";
import { Hook, HookInsert } from "@authhero/adapter-interfaces";

export function create(db: Kysely<Database>) {
  return async (tenant_id: string, hook: HookInsert): Promise<Hook> => {
    const sqlHook = {
      hook_id: nanoid(),
      ...hook,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db
      .insertInto("hooks")
      .values({ ...sqlHook, tenant_id })
      .execute();

    return sqlHook;
  };
}
