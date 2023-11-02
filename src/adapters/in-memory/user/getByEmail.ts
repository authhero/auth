import { UserResponse } from "../../../types/auth0";

export function getByEmail(users: UserResponse[]) {
  return async (
    tenant_id: string,
    email: string,
  ): Promise<UserResponse | null> => {
    return users.find((user) => user.email === email) || null;
  };
}
