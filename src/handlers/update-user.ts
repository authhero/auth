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
    .where("id", "=", profile.id)
    .where("tenantId", "=", tenantId)
    .selectAll()
    .execute();

  console.log("existingUsers", existingUsers);

  // TODO: this is some ugly upsert functionality
  if (!existingUsers.length) {
    console.log("create new");
    await db
      .insertInto("users")
      .values({
        id: userId,
        email: profile.email,
        givenName: profile.givenName || "",
        familyName: profile.familyName || "",
        name: profile.name || "",
        nickname: profile.nickname || "",
        picture: profile.picture || "",
        createdAt: profile.createdAt,
        modifiedAt: profile.modifiedAt,
        tenantId,
      })
      .execute();
  } else {
    console.log("update existing");
    await db
      .updateTable("users")
      .set({
        email: profile.email,
        givenName: profile.givenName,
        familyName: profile.familyName,
        nickname: profile.nickname,
        name: profile.name,
        picture: profile.picture,
        modifiedAt: new Date().toISOString(),
      })
      .where("id", "=", profile.id)
      .where("tenantId", "=", tenantId)
      .execute();
  }
}
