import { SqlUser, SqlCreateUser } from "../../../types";
import { nanoid } from "nanoid";

export function createUser(users: SqlUser[]) {
  return async (tenantId: string, user: SqlCreateUser): Promise<SqlUser> => {
    const sqlUser: SqlUser = {
      ...user,
      email: user.email || "",
      tenant_id: tenantId,
      id: user.id || nanoid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    users.push(sqlUser);

    return sqlUser;
  };
}
