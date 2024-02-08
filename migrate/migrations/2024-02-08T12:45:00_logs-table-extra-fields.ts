import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("logs")
    .addColumn("user_name", "varchar(255)")
    // TODO - include other fields now!
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("logs").dropColumn("details").execute();

  await db.schema.alterTable("logs").dropColumn("user_name");
}
