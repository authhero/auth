import { SqlUser } from "../../../types";
import { ListUsersResponse } from "../../interfaces/Users";
import { ListParams } from "../../interfaces/ListParams";
import { UserResponse } from "../../../types/auth0/UserResponse";

export function listUsers(users: SqlUser[]) {
  return async (
    tenantId,
    { page, per_page, include_totals, q }: ListParams,
  ): Promise<ListUsersResponse> => {
    const usersResponse: UserResponse[] = users.map((user) => {
      const userResponse: UserResponse = {
        ...user,
        user_id: user.id,
        identities: [],
        logins_count: 0,
      };
      return userResponse;
    });

    return {
      users: usersResponse,
      // This might not be 100% correct, but it's close enough for now.
      start: (page - 1) * per_page,
      limit: per_page,
      length: page * per_page,
    };
  };
}
