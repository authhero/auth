import { SqlUser } from "../../../types";
import { PostUsersBody, UserResponse } from "../../../types/auth0/UserResponse";

export function get(users: SqlUser[]) {
  return async (
    tenant_id: string,
    id: string,
  ): Promise<UserResponse | null> => {
    const sqlUser = users.find(
      (user) => user.id === id && user.tenant_id === tenant_id,
    );

    if (!sqlUser) return null;

    const userResponse: UserResponse = {
      ...sqlUser,
      email: sqlUser?.email || "",
      user_id: sqlUser?.id || "",
      identities: [],
      logins_count: 0,
    };

    return userResponse;
  };
}
