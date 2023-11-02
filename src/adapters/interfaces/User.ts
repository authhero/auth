import { SqlUser } from "../../types";
import { Totals } from "../../types/auth0/Totals";
import { PostUsersBody } from "../../types/auth0/UserResponse";

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
  users: SqlUser[];
}

export interface UserDataAdapter {
  create(tenantId: string, PostUsersBody): Promise<SqlUser>;
  get(tenant_id: string, id: string): Promise<SqlUser | null>;
  getByEmail(tenant_id: string, email: string): Promise<SqlUser | null>;
  list(tenantId: string, params: ListUserParams): Promise<ListUsersResponse>;
}
