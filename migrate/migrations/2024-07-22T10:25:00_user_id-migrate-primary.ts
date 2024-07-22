import { Kysely } from "kysely";
import { Database } from "../../src/adapters/kysely/db";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("users").dropConstraint("users_tenants").execute();

  await db.schema
    .alterTable("users")
    .addPrimaryKeyConstraint("users_tenants", ["user_id", "tenant_id"])
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("users").dropConstraint("users_tenants").execute();

  await db.schema
    .alterTable("users")
    .addPrimaryKeyConstraint("users_tenants", ["id", "tenant_id"])
    .execute();
}
