import { Kysely } from "kysely";
import { Database } from "../../src/adapters/kysely/db";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("logs").dropColumn("category").execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("logs")
    .addColumn("category", "varchar(255)", (col) => col.notNull())
    .execute();
}
