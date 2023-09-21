import { Env, Profile } from "../types";

export async function handleLinkedAccount(env: Env, profile: Profile) {
  if (!profile.linked_with) {
    return profile;
  }

  const linkedWith = env.userFactory.getInstanceByName(
    `${profile.tenant_id}|${profile.linked_with}`,
  );

  const { connections, ...profileWithoutConnections } = profile;

  return linkedWith.loginWithConnection.mutate({
    tenantId: profile.tenant_id,
    email: profile.linked_with,
    connection: {
      name: `linked-user|${profile.email}`,
      profile: profileWithoutConnections,
    },
  });
}
