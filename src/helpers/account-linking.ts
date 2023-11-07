import { getId } from "../models";
import { Env, Profile } from "../types";

export async function handleLinkedAccount(env: Env, profile: Profile) {
  if (!profile.linked_with) {
    return profile;
  }

  const linkedWith = env.userFactory.getInstanceByName(
    getId(profile.tenant_id, profile.linked_with),
  );

  const { connections, ...profileWithoutConnections } = profile;

  const connectionName = `linked-user|${profile.email}`;

  const returnProfile = await linkedWith.loginWithConnection.mutate({
    tenantId: profile.tenant_id,
    email: profile.linked_with,
    connection: {
      name: connectionName,
      profile: profileWithoutConnections,
    },
  });

  const { tenant_id, id } = returnProfile;
  await env.data.logs.create({
    category: "login",
    message: `Login with ${connectionName}`,
    tenant_id,
    user_id: id,
  });
}
