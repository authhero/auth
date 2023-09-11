import { Kysely } from "kysely";
import { Database } from "../../types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("connections")
    .addColumn("scope", "varchar(255)")
    .addColumn("response_type", "varchar(255)")
    .addColumn("response_mode", "varchar(255)")
    .addColumn("private_key", "varchar(767)")
    .addColumn("kid", "varchar(255)")
    .addColumn("team_id", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("connections")
    .dropColumn("scope")
    .dropColumn("response_type")
    .dropColumn("response_mode")
    .dropColumn("private_key")
    .dropColumn("kid")
    .dropColumn("team_id")
    .execute();
}
