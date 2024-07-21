import { Kysely } from "kysely";
import { Database } from "../../src/adapters/kysely/db";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("otps").addColumn("ip", "varchar(64)").execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("otps").dropColumn("ip").execute();
}
