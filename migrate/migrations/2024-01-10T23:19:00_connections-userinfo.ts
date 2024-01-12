import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("connections")
    .addColumn("userinfo_endpoint", "varchar(256)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("connections")
    .dropColumn("userinfo_endpoint")
    .execute();
}
