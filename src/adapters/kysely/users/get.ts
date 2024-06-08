import { Database, User } from "../../../types";
import { Kysely } from "kysely";

export function get(db: Kysely<Database>) {
  return async (tenantId: string, id: string): Promise<User | null> => {
    const sqlUser = await db
      .selectFrom("users")
      .where("users.tenant_id", "=", tenantId)
      .where("users.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!sqlUser) {
      return null;
    }

    const user: User = {
      ...sqlUser,
      email: sqlUser.email || "",
      email_verified: sqlUser.email_verified === 1,
      is_social: sqlUser.is_social === 1,
    };

    // loop through all user keys and remove any that are null
    Object.keys(user).forEach((key) => {
      const unsafeTypeUser = user as any;
      if (unsafeTypeUser[key] === null) {
        delete unsafeTypeUser[key];
      }
    });

    return user;
  };
}
