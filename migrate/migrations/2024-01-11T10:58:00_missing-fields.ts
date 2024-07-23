import { Kysely } from "kysely";
import { Database } from "@authhero/kysely-adapter";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("otps")
    .addColumn("audience", "varchar(255)")
    .execute();

  await db.schema
    .alterTable("universal_login_sessions")
    .addColumn("nonce", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("otps").dropColumn("audience").execute();

  await db.schema
    .alterTable("universal_login_sessions")
    .dropColumn("nonce")
    .execute();
}
