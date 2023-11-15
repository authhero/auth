import { SqlUser, SqlCreateUser } from "../../types";
import { Totals } from "../../types/auth0/Totals";
import { ListParams } from "./ListParams";

export interface ListUsersResponse extends Totals {
  users: SqlUser[];
}

export interface UserDataAdapter {
  get(tenant_id: string, id: string): Promise<SqlUser | null>;
  getByEmail(tenant_id: string, email: string): Promise<SqlUser | null>;
  create(tenantId: string, user: SqlCreateUser): Promise<SqlUser>;
  list(tenantId: string, params: ListParams): Promise<ListUsersResponse>;
}
