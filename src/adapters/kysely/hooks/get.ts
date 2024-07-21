import { Kysely } from "kysely";
import { removeNullProperties } from "../helpers/remove-nulls";
import { Hook } from "@authhero/adapter-interfaces";
import { Database } from "../db";

export function get(db: Kysely<Database>) {
  return async (tenant_id: string, hook_id: string): Promise<Hook | null> => {
    const hook = await db
      .selectFrom("hooks")
      .where("hooks.tenant_id", "=", tenant_id)
      .where("hooks.hook_id", "=", hook_id)
      .selectAll()
      .executeTakeFirst();

    if (!hook) {
      return null;
    }

    hook.enabled = !!hook.enabled;

    return removeNullProperties(hook);
  };
}
