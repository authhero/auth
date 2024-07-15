import { Database } from "../../../types";
import { Kysely } from "kysely";
import { removeNullProperties } from "../helpers/remove-nulls";
import { Hook } from "../../../types/Hooks";

export function list(db: Kysely<Database>) {
  return async (tenant_id: string): Promise<Hook[]> => {
    const hooks = await db
      .selectFrom("hooks")
      .where("hooks.tenant_id", "=", tenant_id)
      .selectAll()
      .execute();

    return hooks.map((hook) => {
      const { tenant_id, enabled, ...rest } = hook;
      return removeNullProperties({
        ...rest,
        enabled: !!enabled,
      });
    });
  };
}
