import { Kysely } from "kysely";
import { Database } from "../../types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("connections")
    .addColumn("scope", "varchar(255)")
    .addColumn("responseType", "varchar(255)")
    .addColumn("responseMode", "varchar(255)")
    .addColumn("privateKey", "varchar(767)")
    .addColumn("kid", "varchar(255)")
    .addColumn("teamId", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("connections")
    .dropColumn("scope")
    .dropColumn("responseType")
    .dropColumn("responseMode")
    .dropColumn("privateKey")
    .dropColumn("kid")
    .dropColumn("teamId")
    .execute();
}
