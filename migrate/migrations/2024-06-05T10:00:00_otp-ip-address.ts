import { Kysely } from "kysely";
import { Database } from "@authhero/kysely-adapter";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("otps").addColumn("ip", "varchar(64)").execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("otps").dropColumn("ip").execute();
}
