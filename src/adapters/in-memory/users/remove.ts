import { SqlUser } from "../../../types";

export function remove(users: SqlUser[]) {
  return async (tenant_id: string, id: string): Promise<boolean> => {
    const index = users.findIndex(
      (user) => user.id === id && user.tenant_id === tenant_id,
    );

    if (index === -1) return false;

    users.splice(index, 1);

    return true;
  };
}
