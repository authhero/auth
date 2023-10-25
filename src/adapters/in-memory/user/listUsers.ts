import { UserResponse, Totals } from "../../../types/auth0";
import { ListUserParams, ListUsersResponse } from "../../interfaces/User";

export function listUsers(users: UserResponse[]) {
  return async (
    tenantId,
    { page, per_page, include_totals, q }: ListUserParams,
  ): Promise<ListUsersResponse> => {
    return {
      users,
    };
  };
}
