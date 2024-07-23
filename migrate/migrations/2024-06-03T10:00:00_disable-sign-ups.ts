import { Kysely } from "kysely";
import { Database } from "@authhero/kysely-adapter";

export async function up(db: Kysely<Database>): Promise<void> {
  // await db.schema
  //   .alterTable("applications")
  //   .addColumn("disable_sign_ups", "boolean", (col) => col.notNull())
  //   .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  // await db.schema
  //   .alterTable("applications")
  //   .dropColumn("disable_sign_ups")
  //   .execute();
}
