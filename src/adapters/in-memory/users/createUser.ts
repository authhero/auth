import { SqlUser } from "../../../types";
import { PostUsersBody, UserResponse } from "../../../types/auth0/UserResponse";
import { nanoid } from "nanoid";

export function createUser(users: SqlUser[]) {
  return async (tenantId: string, user: PostUsersBody): Promise<SqlUser> => {
    const sqlUser: SqlUser = {
      ...user,
      email: user.email || "",
      tenant_id: tenantId,
      id: nanoid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    users.push(sqlUser);

    return sqlUser;
  };
}
