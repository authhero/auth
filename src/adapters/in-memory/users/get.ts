import { SqlUser } from "../../../types";

export function get(users: SqlUser[]) {
  return async (tenant_id: string, id: string): Promise<SqlUser | null> => {
    return users.find((user) => user.id === id) || null;
  };
}
