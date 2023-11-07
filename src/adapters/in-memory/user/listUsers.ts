import { UserResponse, Totals } from "../../../types/auth0";
import { ListUsersResponse } from "../../interfaces/Users";
import { ListParams } from "../../interfaces/ListParams";

export function listUsers(users: UserResponse[]) {
  return async (
    tenantId,
    { page, per_page, include_totals, q }: ListParams,
  ): Promise<ListUsersResponse> => {
    return {
      users,
      // no pagination for now
      start: 0,
      limit: 0,
      length: users.length,
    };
  };
}
