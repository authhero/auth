import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("universal_login_sessions")
    .addColumn("vendor_id", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("universal_login_sessions")
    .dropColumn("vendor_id")
    .execute();
}
