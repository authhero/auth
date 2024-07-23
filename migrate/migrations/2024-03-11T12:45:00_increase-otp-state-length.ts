import { Kysely } from "kysely";
import { Database } from "@authhero/kysely-adapter";

export async function up(db: Kysely<Database>): Promise<void> {
  // Uncomment this for planetscale migration
  //   await db.schema
  //     .alterTable("otps")
  //     // column this long working on planetscale on logs column
  //     .modifyColumn("state", "varchar(8192)")
  //     .execute();

  // In SQLite we have to drop and recreate the column
  await db.schema.alterTable("otps").dropColumn("state").execute();
  await db.schema
    .alterTable("otps")
    .addColumn("state", "varchar(8192)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("otps").dropColumn("state").execute();

  await db.schema
    .alterTable("otps")
    .addColumn("state", "varchar(1024)")
    .execute();
}
