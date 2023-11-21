import { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { Database, SqlUser, User } from "../../../types";

export function create(db: Kysely<Database>) {
  return async (tenantId: string, user: User): Promise<SqlUser> => {
    const user_id = user.id || nanoid();
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
      tenant_id: tenantId,
    };

    await db.insertInto("users").values(sqlUser).execute();

    return sqlUser;
  };
}
