import { Kysely } from "kysely";
import { Database } from "../../../types";
import { HookInsert } from "@authhero/adapter-interfaces";

export function update(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    hook_id: string,
    hook: Partial<HookInsert>,
  ): Promise<boolean> => {
    const sqlHook = {
      ...hook,
      updated_at: new Date().toISOString(),
    };

    await db
      .updateTable("hooks")
      .set(sqlHook)
      .where("hooks.hook_id", "=", hook_id)
      .where("hooks.tenant_id", "=", tenant_id)
      .execute();

    return true;
  };
}
