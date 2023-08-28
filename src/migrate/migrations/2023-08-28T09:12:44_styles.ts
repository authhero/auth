import { Kysely } from "kysely";
import { Database } from "../../types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("tenants")
    .addColumn("language", "varchar(255)")
    .addColumn("logo", "varchar(255)")
    .addColumn("primary_color", "varchar(255)")
    .addColumn("secondary_color", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("tenants")
    .dropColumn("language")
    .dropColumn("logo")
    .dropColumn("primary_color")
    .dropColumn("secondary_color")
    .execute();
}
