import { Kysely } from "kysely";
import { Database } from "../types";

export async function cleanup(db: Kysely<Database>) {
  const oneWeekAgo = new Date(
    Date.now() - 1000 * 60 * 60 * 24 * 7,
  ).toISOString();

  await db.deleteFrom("codes").where("created_at", "<", oneWeekAgo).execute();
  await db.deleteFrom("otps").where("created_at", "<", oneWeekAgo).execute();
  await db.deleteFrom("tickets").where("created_at", "<", oneWeekAgo).execute();
  await db
    .deleteFrom("universal_login_sessions")
    .where("created_at", "<", oneWeekAgo)
    .execute();
}
