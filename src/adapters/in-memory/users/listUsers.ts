import { SqlUser } from "../../../types";
import { ListUserParams, ListUsersResponse } from "../../interfaces/User";

export function listUsers(users: SqlUser[]) {
  return async (
    tenantId,
    { page, per_page, include_totals, q }: ListUserParams,
  ): Promise<ListUsersResponse> => {
    return {
      users,
      // This might not be 100% correct, but it's close enough for now.
      start: (page - 1) * per_page,
      limit: per_page,
      length: page * per_page,
    };
  };
}
