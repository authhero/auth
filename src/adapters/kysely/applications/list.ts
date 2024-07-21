import { Application } from "@authhero/adapter-interfaces";
import { Kysely } from "kysely";
import { Database } from "../db";

export function list(db: Kysely<Database>) {
  return async (tenantId: string) => {
    let query = db
      .selectFrom("applications")
      .where("applications.tenant_id", "=", tenantId);

    const applications: Application[] = await query.selectAll().execute();

    return {
      applications,
    };
  };
}
