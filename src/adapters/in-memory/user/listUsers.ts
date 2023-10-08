import { UserResponse, Totals } from "../../../types/auth0";
import { ListUserParams } from "../../interfaces/User";

export function listUsers(users: UserResponse[]) {
  return async (
    tenantId,
    { page, perPage, includeTotals, q }: ListUserParams,
  ) => {
    return {
      users,
    };
  };
}
