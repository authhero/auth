import { Kysely } from "kysely";
import { Database } from "../../src/adapters/kysely/db";

export async function up(db: Kysely<Database>): Promise<void> {
  // Sqlite does not support altering tables to add unique constraints
  // await db.schema
  //   .alterTable("users")
  //   .addUniqueConstraint("unique_email_provider", [
  //     "email",
  //     "provider",
  //     "tenant_id",
  //   ])
  //   .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("users")
    .dropConstraint("unique_email_provider")
    .execute();
}
