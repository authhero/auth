import { getId, User } from "../models";
import { getDb } from "../services/db";
import { Env, SqlUser, UserTag } from "../types";

export async function updateUser(env: Env, tenantId: string, email: string) {
  const userId = getId(tenantId, email);
  const userInstance = User.getInstanceByName(env.USER, userId);
  const profile = await userInstance.getProfile.query();

  if (!profile || !profile.email) {
    console.log("No profile found for user", userId);
    return;
  }

  const db = getDb(env);

  const tags: UserTag[] = profile.connections.map((connection) => ({
    category: "connection",
    name: connection.name,
  }));

  const user: SqlUser = {
    id: profile.id,
    email: profile.email,
    givenName: profile.given_name || "",
    familyName: profile.family_name || "",
    name: profile.name || "",
    nickname: profile.nickname || "",
    picture: profile.picture || "",
    createdAt: profile.created_at,
    modifiedAt: profile.modified_at,
    tags: JSON.stringify(tags),
    tenantId,
  };

  try {
    await db
      .insertInto("users")
      .values(user)
      // .onConflict((oc) => oc.columns(["id", "tenantId"]).doUpdateSet(user))
      .execute();
  } catch (err: any) {
    if (!err.message.includes("AlreadyExists")) {
      throw err;
    }
    await db.updateTable("users").set(user).where("id", "=", user.id).execute();
  }
}
