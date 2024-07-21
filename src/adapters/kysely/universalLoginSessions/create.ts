import { UniversalLoginSessionInsert } from "@authhero/adapter-interfaces";
import { Database } from "../../../types";
import { Kysely } from "kysely";

export function create(db: Kysely<Database>) {
  return async (tenant_id: string, session: UniversalLoginSessionInsert) => {
    const { authParams, ...rest } = session;

    const timestamps = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db
      .insertInto("universal_login_sessions")
      .values({ ...authParams, ...rest, ...timestamps, tenant_id })
      .execute();

    // TODO: updaate the adapter to return the created entity
    // return { ...session, ...timestamps };
  };
}
