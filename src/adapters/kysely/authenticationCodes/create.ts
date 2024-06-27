import { nanoid } from "nanoid";
import { Database, AuthenticationCode } from "../../../types";
import { Kysely } from "kysely";

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
