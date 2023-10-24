import { Totals } from "../../types/auth0/Totals";
import { PostUsersBody, UserResponse } from "../../types/auth0/UserResponse";

export interface ListUserParams {
  page: number;
  perPage: number;
  includeTotals: boolean;
  q?: string;
}

export interface UserDataAdapter {
  createUser(tenantId: string, PostUsersBody): Promise<UserResponse>;
  listUsers(
    tenantId: string,
    ListUserParams,
  ): Promise<{ users: UserResponse[]; totals?: Totals }>;
}
