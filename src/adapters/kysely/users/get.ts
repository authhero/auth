import { Database, User } from "../../../types";
import { Kysely } from "kysely";

export function get(db: Kysely<Database>) {
  return async (tenantId: string, id: string): Promise<User | null> => {
    const user = await db
      .selectFrom("users")
      .where("users.tenant_id", "=", tenantId)
      .where("users.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!user) {
      return null;
    }

    // loop through all user keys and remove any that are null
    Object.keys(user).forEach((key) => {
      const iHateTheseHacks = user as any;
      if (iHateTheseHacks[key] === null) {
        delete iHateTheseHacks[key];
      }
    });

    return {
      ...user,
      email_verified: user.email_verified === 1,
      is_social: user.is_social === 1,
    };
  };
}
