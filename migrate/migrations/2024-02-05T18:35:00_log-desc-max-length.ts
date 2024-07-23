import { Kysely } from "kysely";
import { Database } from "@authhero/kysely-adapter";

export async function up(db: Kysely<Database>): Promise<void> {
  // This does not work
  // await db.schema
  //   .alterTable("logs")
  //   .modifyColumn("details", "varchar(65535)")
  //   .execute();

  // // This also does not work
  // await db.schema
  //   .alterTable("logs")
  //   .alterColumn("details", (column) => {
  //     return column.setDataType("varchar(65535)");
  //   })
  //   .execute();

  // Just drop the column and recreate it
  await db.schema.alterTable("logs").dropColumn("details").execute();

  await db.schema
    .alterTable("logs")
    // too long and exceeds the planetscale max length for the row
    // .addColumn("details", "varchar(16383)")
    .addColumn("details", "varchar(8192)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("logs").dropColumn("details").execute();

  await db.schema
    .alterTable("logs")
    .addColumn("details", "varchar(2048)")
    .execute();
}
