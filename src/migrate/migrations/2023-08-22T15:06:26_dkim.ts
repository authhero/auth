import { Kysely } from "kysely";
import { Database } from "../../types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("domains")
    .addColumn("dkimPrivateKey", "varchar(2048)")
    .addColumn("dkimPublicKey", "varchar(2048)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("domains")
    .dropColumn("dkimPrivateKey")
    .dropColumn("dkimPrivateKey")
    .execute();
}
