import { Kysely } from "kysely";
import { Database } from "../../src/adapters/kysely/db";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("tenants")
    .addColumn("support_url", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("tenants").dropColumn("support_url").execute();
}
