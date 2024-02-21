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

interface GetPrimaryUserByEmailAndProviderParams {
  userAdapter: UserDataAdapter;
  tenant_id: string;
  email: string;
  provider: string;
}

export async function getUserByEmailAndProvider({
  userAdapter,
  tenant_id,
  email,
  provider,
}: GetPrimaryUserByEmailAndProviderParams): Promise<User | null> {
  const { users } = await userAdapter.list(tenant_id, {
    page: 0,
    per_page: 1,
    include_totals: false,
    q: `email:${email} provider:${provider}`,
  });

  const [user] = users;

  return user || null;
}

interface GetPrimaryUserByEmailParams {
  userAdapter: UserDataAdapter;
  tenant_id: string;
  email: string;
}

export async function getPrimaryUserByEmail({
  userAdapter,
  tenant_id,
  email,
}: GetPrimaryUserByEmailParams): Promise<User | undefined> {
  const { users } = await userAdapter.list(tenant_id, {
    page: 0,
    per_page: 1,
    include_totals: false,
    q: `email:${email}`,
  });

  return users.find((user) => !user.linked_to);
}

export async function getPrimaryUserByEmailAndProvider({
  userAdapter,
  tenant_id,
  email,
  provider,
}: GetPrimaryUserByEmailAndProviderParams): Promise<User | null> {
  const user = await getUserByEmailAndProvider({
    userAdapter,
    tenant_id,
    email,
    provider,
  });

  if (!user) {
    return null;
  }

  if (!user.linked_to) {
    return user;
  }

  return userAdapter.get(tenant_id, user.linked_to);
}
