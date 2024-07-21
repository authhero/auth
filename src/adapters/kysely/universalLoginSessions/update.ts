import { UniversalLoginSession } from "@authhero/adapter-interfaces";
import { Kysely } from "kysely";
import { Database } from "../db";

export function update(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    id: string,
    session: UniversalLoginSession,
  ) => {
    const { authParams, ...rest } = session;
    const results = await db
      .updateTable("universal_login_sessions")
      .set({ ...authParams, ...rest })
      .where("id", "=", id)
      .where("tenant_id", "=", tenant_id)
      .execute();

    return results.length === 1;
  };
}
