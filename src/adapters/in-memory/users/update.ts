import { BaseUser, SqlUser } from "../../../types";

export function update(users: SqlUser[]) {
  return async (
    tenant_id: string,
    id: string,
    user: BaseUser,
  ): Promise<boolean> => {
    const index = users.findIndex(
      (user) => user.id === id && user.tenant_id === tenant_id,
    );

    if (index === -1) return false;

    users[index] = { ...users[index], ...user };

    return true;
  };
}
