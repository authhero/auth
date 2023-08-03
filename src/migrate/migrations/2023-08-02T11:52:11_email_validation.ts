import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("applications")
    .addColumn("email_validation", "varchar")
    // .addColumn("two_factor_authentication", "varchar")
    // .addColumn("enable_signup", "boolean")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("applications")
    .dropColumn("email_validation")
    // .dropColumn("two_factor_authentication")
    // .dropColumn("enable_signup")
    .execute();
}
