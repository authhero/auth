import { Kysely } from "kysely";
import { Database } from "@authhero/kysely-adapter";

export async function up(db: Kysely<Database>): Promise<void> {
  // Uncomment this for planetscale migration
  //   await db.schema
  //     .alterTable("logs")
  //     .modifyColumn("user_agent", "varchar(1024)")
  //     .execute();

  // In SQLite we have to drop and recreate the column
  await db.schema.alterTable("logs").dropColumn("user_agent").execute();
  await db.schema
    .alterTable("logs")
    .addColumn("user_agent", "varchar(1024)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("logs").dropColumn("user_agent").execute();

  await db.schema
    .alterTable("logs")
    .addColumn("user_agent", "varchar(255)")
    .execute();
}
