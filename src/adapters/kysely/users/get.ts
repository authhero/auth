import { Kysely } from "kysely";
import { removeNullProperties } from "../helpers/remove-nulls";
import { userToIdentity } from "./user-to-identity";
import userIdParse from "../../../utils/userIdParse";
import { Database } from "../db";
import { User } from "@authhero/adapter-interfaces";

export function get(db: Kysely<Database>) {
  return async (tenantId: string, user_id: string): Promise<User | null> => {
    const [sqlUser, linkedUsers] = await Promise.all([
      db
        .selectFrom("users")
        .where("users.tenant_id", "=", tenantId)
        .where("users.user_id", "=", user_id)
        .selectAll()
        .executeTakeFirst(),
      db
        .selectFrom("users")
        .where("users.tenant_id", "=", tenantId)
        .where("users.linked_to", "=", user_id)
        .selectAll()
        .execute(),
    ]);

    if (!sqlUser) {
      return null;
    }

    const { tenant_id, ...rest } = sqlUser;

    const user: User = {
      ...rest,
      email: sqlUser.email || "",
      email_verified: sqlUser.email_verified === 1,
      is_social: sqlUser.is_social === 1,
      identities: [
        {
          connection: sqlUser.connection,
          provider: sqlUser.provider,
          user_id: userIdParse(sqlUser.user_id),
          isSocial: Boolean(sqlUser.is_social),
        },
        ...linkedUsers.map(userToIdentity),
      ],
    };

    return removeNullProperties(user);
  };
}
