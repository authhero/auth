import { UserResponse, Totals } from "../../../types/auth0";
import { ListUserParams, ListUsersResponse } from "../../interfaces/User";

export function listUsers(users: UserResponse[]) {
  return async (
    tenantId,
    { page, per_page, include_totals, q }: ListUserParams,
  ): Promise<ListUsersResponse> => {
    // TODO - can we extract out common functions for sorting, pagination, filtering?
    // THEN - use same functions for inmemory & planetscale?
    // THEN - we could test this in integration tests
    return {
      users,
    };
  };
}
