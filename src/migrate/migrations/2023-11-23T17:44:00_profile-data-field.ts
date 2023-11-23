import { Kysely } from "kysely";
import { Database } from "../../types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("profileData", "varchar(65535)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("users").dropColumn("profileData").execute();
}
