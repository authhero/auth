import { User } from "../types";
import { UserDataAdapter } from "../adapters/interfaces/Users";

export async function getUsersByEmail(
  userAdapter: UserDataAdapter,
  tenantId: string,
  email: string,
): Promise<User[]> {
  const response = await userAdapter.list(tenantId, {
    page: 0,
    per_page: 10,
    include_totals: false,
    q: `email:${email}`,
  });

  return response.users;
}
