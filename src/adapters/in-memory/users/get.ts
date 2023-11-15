import { SqlUser } from "../../../types";

export function get(users: SqlUser[]) {
  return async (tenant_id: string, id: string): Promise<SqlUser | null> => {
    const sqlUser = users.find(
      (user) => user.id === id && user.tenant_id === tenant_id,
    );

    if (!sqlUser) return null;

    return sqlUser;
  };
}
