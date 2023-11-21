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
      email_verified: user.email_verified,
      last_ip: user.last_ip,
      last_login: user.last_login,
      login_count: user.login_count,
      provider: user.provider,
      connection: user.connection,
      is_social: user.is_social,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: tenantId,
    };

    await db.insertInto("users").values(sqlUser).execute();

    return sqlUser;
  };
}
