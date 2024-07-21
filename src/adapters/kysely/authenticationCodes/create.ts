import { AuthenticationCode } from "@authhero/adapter-interfaces";
import { Kysely } from "kysely";
import { Database } from "../db";

export function create(db: Kysely<Database>) {
  return async (tenant_id: string, params: AuthenticationCode) => {
    const { authParams, ...rest } = params;

    await db
      .insertInto("authentication_codes")
      .values({
        ...rest,
        ...authParams,
        tenant_id,
      })
      .execute();
  };
}
