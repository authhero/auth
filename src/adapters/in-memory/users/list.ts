import { SqlUser, User } from "../../../types";
import { ListUsersResponse } from "../../interfaces/Users";
import { ListParams } from "../../interfaces/ListParams";
import { filterItems } from "../utils/filter";

export function list(users: SqlUser[]) {
  return async (
    tenantId,
    { page, per_page, include_totals, q }: ListParams,
  ): Promise<ListUsersResponse> => {
    const tenantUsers = users.filter((user) => user.tenant_id === tenantId);
    const filteredUsers = filterItems(tenantUsers, q);

    const start = (page - 1) * per_page;

    return {
      users: filteredUsers.slice(start, per_page),
      start,
      limit: per_page,
      length: filteredUsers.length,
    };
  };
}
