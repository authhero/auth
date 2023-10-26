import { Totals } from "../../types/auth0/Totals";
import { PostUsersBody, UserResponse } from "../../types/auth0/UserResponse";

export interface ListUserParams {
  page: number;
  per_page: number;
  include_totals: boolean;
  q?: string;
  sort?: {
    sort_by: string;
    sort_order: "asc" | "desc";
  };
}

export interface ListUsersResponse extends Totals {
  users: UserResponse[];
}

export interface UserDataAdapter {
  create(tenantId: string, PostUsersBody): Promise<UserResponse>;
  list(tenantId: string, params: ListUserParams): Promise<ListUsersResponse>;
}
