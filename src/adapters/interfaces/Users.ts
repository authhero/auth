import { BaseUser, User } from "../../types";
import { Totals } from "../../types/auth0/Totals";
import { ListParams } from "./ListParams";

export interface ListUsersResponse extends Totals {
  users: User[];
}

export interface UserDataAdapter {
  get(tenant_id: string, id: string): Promise<User | null>;
  create(tenantId: string, user: User): Promise<User>;
  remove(tenantId: string, id: string): Promise<boolean>;
  list(tenantId: string, params: ListParams): Promise<ListUsersResponse>;
  update(tenantId: string, id: string, user: Partial<User>): Promise<boolean>;
  unlink(tenantId: string, id: string): Promise<boolean>;
}
