import { UniversalLoginSession } from "@authhero/adapter-interfaces";
import { Database } from "../../../types";
import { Kysely } from "kysely";

export function create(db: Kysely<Database>) {
  return async (session: UniversalLoginSession) => {
    const { authParams, ...rest } = session;

    await db
      .insertInto("universal_login_sessions")
      .values({ ...authParams, ...rest })
      .execute();
  };
}
