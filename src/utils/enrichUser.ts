import userIdParse from "./userIdParse";
import { Env, User } from "../types";
import { UserResponse } from "../types/auth0/UserResponse";

export async function enrichUser(
  env: Env,
  tenantId: string,
  primaryUser: User,
): Promise<UserResponse> {
  const linkedusers = await env.data.users.list(tenantId, {
    page: 0,
    per_page: 10,
    include_totals: false,
    q: `linked_to:${primaryUser.id}`,
  });

  const identities = [primaryUser, ...linkedusers.users].map((u) => ({
    connection: u.connection,
    provider: u.provider,
    user_id: userIdParse(u.id),
    isSocial: u.is_social,
    // TODO - add profileData here! lift from other PRs....
  }));

  const { id, ...userWithoutId } = primaryUser;

  return {
    ...userWithoutId,
    identities,
    user_id: primaryUser.id,
  };
}
