import { Kysely } from "kysely";
import { Database } from "../../types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("domains")
    .addColumn("email_service", "varchar(255)")
    .addColumn("email_api_key", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("domains")
    .dropColumn("email_service")
    .dropColumn("email_api_key")
    .execute();
}
