import { SqlUser, User } from "../../types";
import { Totals } from "../../types/auth0/Totals";
import { ListParams } from "./ListParams";

export interface ListUsersResponse extends Totals {
  users: SqlUser[];
}

export interface UserDataAdapter {
  get(tenant_id: string, id: string): Promise<User | null>;
  getByEmail(tenant_id: string, email: string): Promise<User | null>;
  create(tenantId: string, user: User): Promise<User>;
  list(tenantId: string, params: ListParams): Promise<ListUsersResponse>;
}
