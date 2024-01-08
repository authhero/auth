import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("locale", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("users").dropColumn("locale").execute();
}
