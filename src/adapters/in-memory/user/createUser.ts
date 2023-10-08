import { nanoid } from "nanoid";
import { PostUsersBody, UserResponse } from "../../../types/auth0";

export function createUser(users: UserResponse[]) {
  return async (
    tenantId: string,
    user: PostUsersBody,
  ): Promise<UserResponse> => {
    const createdUser: UserResponse = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      logins_count: 0,
      email: "",
      username: "",
      identities: [],
      user_id: nanoid(),
      ...user,
    };

    users.push(createdUser);

    return createdUser;
  };
}
