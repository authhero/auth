import { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { PostUsersBody } from "../../../types/auth0";
import { Database, SqlUser } from "../../../types";

export function createUser(db: Kysely<Database>) {
  return async (tenantId: string, user: PostUsersBody): Promise<SqlUser> => {
    const user_id = user.user_id || nanoid();
    const sqlUser: SqlUser = {
      id: user_id,
      email: user.email || "",
      given_name: user.given_name,
      family_name: user.family_name,
      name: user.name,
      nickname: user.nickname,
      picture: user.picture,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: JSON.stringify([]),
      tenant_id: tenantId,
    };

    await db.insertInto("users").values(sqlUser).execute();

    return sqlUser;
  };
}
