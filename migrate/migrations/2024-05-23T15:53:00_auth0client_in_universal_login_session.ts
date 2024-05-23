import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("universal_login_sessions")
    .addColumn("auth0Client", "varchar(255)")
    .execute();

  await db.schema
    .alterTable("otps")
    .addColumn("auth0Client", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("universal_login_sessions")
    .dropColumn("auth0Client")
    .execute();

  await db.schema.alterTable("otps").dropColumn("auth0Client").execute();
}
