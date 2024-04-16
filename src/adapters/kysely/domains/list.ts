import { Database } from "../../../types";
import { Kysely } from "kysely";

export function list(db: Kysely<Database>) {
  return async (tenantId: string) => {
    let query = db
      .selectFrom("domains")
      .where("domains.tenant_id", "=", tenantId);

    const domains = await query.selectAll().execute();

    return {
      domains,
    };
  };
}
