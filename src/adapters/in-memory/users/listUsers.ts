import { SqlUser } from "../../../types";
import { ListUsersResponse } from "../../interfaces/Users";
import { ListParams } from "../../interfaces/ListParams";

export function listUsers(users: SqlUser[]) {
  return async (
    tenantId,
    { page, per_page, include_totals, q }: ListParams,
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
