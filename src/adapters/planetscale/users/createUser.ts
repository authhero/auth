import { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { PostUsersBody, UserResponse } from "../../../types/auth0";
import { Database, SqlUser } from "../../../types";

export function createUser(db: Kysely<Database>) {
  return async (
    tenantId: string,
    user: PostUsersBody,
  ): Promise<UserResponse> => {
    // TODO - is POSTing user_id allowed in Auth0 mgmt API?
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

    // const { updated_at, id, ...userWithoutFields } = sqlUser;

    // return {
    //   ...userWithoutFields,
    //   updated_at,
    //   logins_count: 0,
    //   username: sqlUser.email,
    //   identities: [],
    //   user_id,
    // };
  };
}
