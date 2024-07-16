import { Kysely } from "kysely";
import { Database } from "../../../types";
import { Hook } from "../../../types/Hooks";
import { removeNullProperties } from "../helpers/remove-nulls";

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
