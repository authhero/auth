import { UserResponse, Totals } from "../../../types/auth0";
import { ListUserParams } from "../../interfaces/User";

export function listUsers(users: UserResponse[]) {
  return async (
    tenantId,
    // why is our build process not picking up these types here? hard to spot issues...
    { page, perPage, includeTotals, q }: ListUserParams,
  ) => {
    return {
      users,
    };
  };
}
