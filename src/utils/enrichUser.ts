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

  const primaryUserIdentity = {
    connection: primaryUser.connection,
    provider: primaryUser.provider,
    user_id: userIdParse(primaryUser.id),
    isSocial: primaryUser.is_social,
  };

  const linkedUserIdentities = linkedusers.users.map((u) => {
    let profileData: { [key: string]: any } = {};

    try {
      profileData = JSON.parse(u.profileData || "{}");
    } catch (e) {
      console.error("Error parsing profileData", e);
    }

    return {
      connection: u.connection,
      provider: u.provider,
      user_id: userIdParse(u.id),
      isSocial: u.is_social,
      // copied from users/get/[id] route
      profileData: {
        // both these two appear on every profile type
        email: u.email,
        email_verified: u.email_verified,
        ...profileData,
      },
    };
  });

  const { id, ...userWithoutId } = primaryUser;

  return {
    ...userWithoutId,
    identities: [primaryUserIdentity, ...linkedUserIdentities],
    user_id: primaryUser.id,
  };
}
