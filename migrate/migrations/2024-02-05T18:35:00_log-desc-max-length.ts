import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  // when I try and alter the column I get SQL errors...
  await db.schema.alterTable("logs").dropColumn("details").execute();

  await db.schema
    .alterTable("logs")
    .addColumn("details", "varchar(65535)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("logs")
    .modifyColumn("details", "varchar(2048)")
    .execute();
}
