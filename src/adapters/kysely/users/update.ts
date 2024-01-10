import { Kysely } from "kysely";
import { BaseUser, Database, SqlUser, User } from "../../../types";

// we have a PostUsersBody so why not a PatchUsersBody?
// or should this be Partial<User>? but not all the fields can be updated...
type PatchUser = Partial<BaseUser> & { email_verified?: boolean };

export function update(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    id: string,
    user: PatchUser,
  ): Promise<boolean> => {
    const booleans: any = {};

    if (user.email_verified !== undefined) {
      booleans.email_verified = user.email_verified ? 1 : 0;
    }
    // do we want another fix for is_social? was this the bug the other day?

    const sqlUser: SqlUser = {
      ...user,
      ...booleans,
      updated_at: new Date().toISOString(),
    };

    const results = await db
      .updateTable("users")
      .set(sqlUser)
      .where("users.tenant_id", "=", tenant_id)
      .where("users.id", "=", id)
      .execute();

    return results.length === 1;
  };
}
