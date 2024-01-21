import { SqlUser } from "../../../types";

export function getByEmail(users: SqlUser[]) {
  return async (tenant_id: string, email: string): Promise<SqlUser[]> => {
    const sqlUsers = users.filter(
      (user) => user.tenant_id === tenant_id && user.email === email,
    );

    return sqlUsers;
  };
}
