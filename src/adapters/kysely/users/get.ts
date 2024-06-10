import { Database, User } from "../../../types";
import { Kysely } from "kysely";
import { removeNullProperties } from "../helpers/remove-nulls";

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

    return removeNullProperties(user);
  };
}
