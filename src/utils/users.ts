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

interface GetPrimaryUserByEmailAndConnectionParams {
  userAdapter: UserDataAdapter;
  tenant_id: string;
  email: string;
  connection: string;
}

export async function getUserByEmailAndConnection({
  userAdapter,
  tenant_id,
  email,
  connection,
}: GetPrimaryUserByEmailAndConnectionParams): Promise<User | null> {
  const { users } = await userAdapter.list(tenant_id, {
    page: 0,
    per_page: 1,
    include_totals: false,
    q: `email:${email} connection:${connection}`,
  });

  const [user] = users;

  return user || null;
}

export async function getPrimaryUserByEmailAndConnection({
  userAdapter,
  tenant_id,
  email,
  connection,
}: GetPrimaryUserByEmailAndConnectionParams): Promise<User | null> {
  const user = await getUserByEmailAndConnection({
    userAdapter,
    tenant_id,
    email,
    connection,
  });

  if (!user) {
    return null;
  }

  if (!user.linked_to) {
    return user;
  }

  return userAdapter.get(tenant_id, user.linked_to);
}
