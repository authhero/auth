import { SqlUser } from "../../types";
import { Totals } from "../../types/auth0/Totals";
// also PostUsersBody... should this be handled in the route? hmmmmmmm. Yes right?
// so then can revert the tests to use SqlUser... easier fixtures
import { PostUsersBody } from "../../types/auth0/UserResponse";
import { ListParams } from "./ListParams";

export interface ListUsersResponse extends Totals {
  users: SqlUser[];
}

export interface UserDataAdapter {
  get(tenant_id: string, id: string): Promise<SqlUser | null>;
  getByEmail(tenant_id: string, email: string): Promise<SqlUser | null>;
  create(tenantId: string, PostUsersBody): Promise<SqlUser>;
  list(tenantId: string, params: ListParams): Promise<ListUsersResponse>;
}
