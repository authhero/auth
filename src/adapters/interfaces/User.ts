import { Totals } from "../../types/auth0/Totals";
import { GetUserResponse } from "../../types/auth0/UserResponse";

export interface ListUserParams {
  tenantId: string;
  page: number;
  perPage: number;
  includeTotals: boolean;
  q?: string;
}

export interface UserDataAdapter {
  listUsers(
    ListUserParams,
  ): Promise<{ users: GetUserResponse[]; totals?: Totals }>;
}
