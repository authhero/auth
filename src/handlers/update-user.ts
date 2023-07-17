import { getId, User } from "../models";
import { getDb } from "../services/db";
import { Env } from "../types";

export async function updateUser(env: Env, tenantId: string, email: string) {
  const userId = getId(tenantId, email);
  const userInstance = User.getInstanceByName(env.USER, userId);
  const profile = await userInstance.getProfile.query();

  if (!profile || !profile.email) {
    console.log("No profile found for user", userId);
    return;
  }

  const db = getDb(env);
  const existingUsers = await db
    .selectFrom("users")
    .where("id", "=", userId)
    .selectAll()
    .execute();

  // TODO: this is some ugly upsert functionality
  if (!existingUsers.length) {
    await db
      .insertInto("users")
      .values({
        id: userId,
        email: profile.email,
        givenName: profile.given_name || "",
        familyName: profile.family_name || "",
        name: profile.name || "",
        nickname: profile.nickname || "",
        picture: profile.picture || "",
        createdAt: profile.created_at,
        modifiedAt: profile.modified_at,
        tenantId,
      })
      .execute();
  } else {
    await db
      .updateTable("users")
      .set({
        email: profile.email,
        givenName: profile.given_name,
        familyName: profile.family_name,
        nickname: profile.nickname,
        name: profile.name,
        picture: profile.picture,
        modifiedAt: new Date().toISOString(),
      })
      .where("id", "=", userId)
      .execute();
  }
}
