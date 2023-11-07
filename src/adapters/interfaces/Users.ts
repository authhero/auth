import { SqlUser } from "../../types";
import { Totals } from "../../types/auth0/Totals";
import { PostUsersBody, UserResponse } from "../../types/auth0/UserResponse";
import { ListParams } from "./ListParams";

export interface ListUsersResponse extends Totals {
  users: SqlUser[];
}

export interface UserDataAdapter {
  get(tenant_id: string, id: string): Promise<UserResponse | null>;
  getByEmail(tenant_id: string, email: string): Promise<UserResponse | null>;
  create(tenantId: string, PostUsersBody): Promise<UserResponse>;
  list(tenantId: string, params: ListParams): Promise<ListUsersResponse>;
}
