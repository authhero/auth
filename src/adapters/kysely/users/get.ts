import { Database, User, userSchema } from "../../../types";
import { Kysely } from "kysely";
import { removeNullProperties } from "../helpers/remove-nulls";
import { userToIdentity } from "./user-to-identity";
import userIdParse from "../../../utils/userIdParse";

export function get(db: Kysely<Database>) {
  return async (tenantId: string, id: string): Promise<User | null> => {
    const [sqlUser, linkedUsers] = await Promise.all([
      db
        .selectFrom("users")
        .where("users.tenant_id", "=", tenantId)
        .where("users.id", "=", id)
        .selectAll()
        .executeTakeFirst(),
      db
        .selectFrom("users")
        .where("users.tenant_id", "=", tenantId)
        .where("users.linked_to", "=", id)
        .selectAll()
        .execute(),
    ]);

    if (!sqlUser) {
      return null;
    }

    const user: User = {
      ...sqlUser,
      email: sqlUser.email || "",
      email_verified: sqlUser.email_verified === 1,
      is_social: sqlUser.is_social === 1,
      identities: [
        {
          connection: sqlUser.connection,
          provider: sqlUser.provider,
          user_id: userIdParse(sqlUser.id),
          isSocial: Boolean(sqlUser.is_social),
        },
        ...linkedUsers.map(userToIdentity),
      ],
    };

    return removeNullProperties(user);
  };
}
