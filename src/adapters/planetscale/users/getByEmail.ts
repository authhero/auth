import { Database, SqlUser } from "../../../types";
import { Kysely } from "kysely";
import { UserResponse } from "../../../types/auth0";

export function getByEmail(db: Kysely<Database>) {
  return async (tenantId, email: string): Promise<UserResponse | null> => {
    const user = await db
      .selectFrom("users")
      .where("users.tenant_id", "=", tenantId)
      .where("users.email", "=", email)
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
