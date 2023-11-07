import { SqlUser } from "../../../types";
import { PostUsersBody, UserResponse } from "../../../types/auth0/UserResponse";
import { nanoid } from "nanoid";

export function createUser(users: SqlUser[]) {
  return async (
    tenantId: string,
    user: PostUsersBody,
  ): Promise<UserResponse> => {
    const sqlUser: SqlUser = {
      ...user,
      email: user.email || "",
      tenant_id: tenantId,
      id: user.user_id || nanoid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    users.push(sqlUser);

    // so many different types of user... this is what matches the auth0 mgmt API though. Our SQL user
    // matches the columns in our users table
    const userResponse: UserResponse = {
      ...sqlUser,
      user_id: sqlUser.id,
      identities: [],
      logins_count: 0,
    };

    return userResponse;
  };
}
