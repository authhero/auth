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

    if (!user) {
      return null;
    }

    const userResponse: UserResponse = {
      ...user,
      logins_count: 0,
      username: user.email,
      identities: [],
      user_id: user.id,
    };

    return userResponse;
  };
}
