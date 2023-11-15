import { SqlUser } from "../../../types";

export function getByEmail(users: SqlUser[]) {
  return async (tenant_id: string, email: string): Promise<SqlUser | null> => {
    const sqlUser = users.find((user) => user.email === email) || null;

    return sqlUser;
  };
}
