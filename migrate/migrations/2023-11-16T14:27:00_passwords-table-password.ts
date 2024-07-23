import { Kysely } from "kysely";
import { Database } from "@authhero/kysely-adapter";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("passwords")
    .addColumn(
      "password",
      "varchar(255)",
      // do we want not null?
      (col) => col.notNull(),
    )
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("passwords").dropColumn("password").execute();
}
