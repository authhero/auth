import { SqlUser } from "../../../types";

export function createUser(users: SqlUser[]) {
  return async (tenantId: string, user: SqlUser): Promise<SqlUser> => {
    users.push(user);

    return user;
  };
}
