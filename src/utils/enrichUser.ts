import { Env, User } from "../types";
import { UserResponse } from "../types/auth0/UserResponse";

export async function enrichUser(
  env: Env,
  tenantId: string,
  primaryUser: User,
): Promise<UserResponse> {
  const { id, ...userWithoutId } = primaryUser;

  const user: UserResponse = {
    ...userWithoutId,
    user_id: primaryUser.id,
  };

  return user;
}
