import { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { PostUsersBody, UserResponse } from "../../../types/auth0";
import { Database, SqlUser } from "../../../types";

export function createUser(db: Kysely<Database>) {
  return async (
    tenantId: string,
    user: PostUsersBody,
  ): Promise<UserResponse> => {
    const sqlUser: SqlUser = {
      id: user.user_id || nanoid(),
      email: user.email || "",
      given_name: user.given_name,
      family_name: user.family_name,
      name: user.name,
      nickname: user.nickname,
      picture: user.picture,
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      tags: JSON.stringify([]),
      tenant_id: tenantId,
    };

    await db.insertInto("users").values(sqlUser).execute();

    const { modified_at, ...userWithoutFields } = sqlUser;

    return {
      ...userWithoutFields,
      updated_at: modified_at,
      logins_count: 0,
      username: sqlUser.email,
      identities: [],
    };
  };
}
