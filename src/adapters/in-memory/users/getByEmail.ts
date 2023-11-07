import { SqlUser } from "../../../types";
import { UserResponse } from "../../../types/auth0/UserResponse";

export function getByEmail(users: SqlUser[]) {
  return async (
    tenant_id: string,
    email: string,
  ): Promise<UserResponse | null> => {
    const sqlUser = users.find((user) => user.email === email) || null;

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
