import { Database, SqlUser } from "../../../types";
import { Kysely } from "kysely";
import { PostUsersBody, UserResponse } from "../../../types/auth0";

export function get(db: Kysely<Database>) {
  return async (tenantId, id: string): Promise<UserResponse | null> => {
    const user = await db
      .selectFrom("users")
      .where("users.tenant_id", "=", tenantId)
      .where("users.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    return user || null;
  };
}
