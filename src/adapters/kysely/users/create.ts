import { Kysely } from "kysely";
import { Database, SqlUser, User } from "../../../types";

export function create(db: Kysely<Database>) {
  return async (tenantId: string, user: User): Promise<User> => {
    const sqlUser: SqlUser = {
      ...user,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: tenantId,
      email_verified: user.email_verified ? 1 : 0,
      is_social: user.is_social ? 1 : 0,
    };

    await db.insertInto("users").values(sqlUser).execute();

    return {
      ...sqlUser,
      email_verified: sqlUser.email_verified === 1,
      is_social: sqlUser.is_social === 1,
    };
  };
}
