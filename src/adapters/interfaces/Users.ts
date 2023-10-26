import { Totals } from "../../types/auth0/Totals";
import { PostUsersBody, UserResponse } from "../../types/auth0/UserResponse";
import { ListParams } from "./ListParams";

export interface ListUsersResponse extends Totals {
  users: UserResponse[];
}

export interface UserDataAdapter {
  create(tenantId: string, PostUsersBody): Promise<UserResponse>;
  list(tenantId: string, params: ListParams): Promise<ListUsersResponse>;
}
