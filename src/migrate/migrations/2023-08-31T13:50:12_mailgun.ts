import { Kysely } from "kysely";
import { Database } from "../../types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("domains")
    .addColumn("email_service", "varchar(255)")
    .addColumn("email_api_key", "varchar(255)")
    // Fix casing
    .addColumn("dkim_private_key", "varchar(2048)")
    .addColumn("dkim_public_key", "varchar(2048)")
    .dropColumn("dkimPrivateKey")
    .dropColumn("dkimPrivateKey")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("domains")
    .dropColumn("email_service")
    .dropColumn("email_api_key")
    .dropColumn("dkim_private_key")
    .dropColumn("dkim_public_key")
    .addColumn("dkimPrivateKey", "varchar(2048)")
    .addColumn("dkimPublicKey", "varchar(2048)")
    .execute();
}
