import { Kysely } from "kysely";
import { Database } from "../../types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("applications")
    .renameColumn("modified_at", "updated_at")
    .execute();

  await db.schema
    .alterTable("connections")
    .renameColumn("modified_at", "updated_at")
    .execute();

  await db.schema
    .alterTable("domains")
    .renameColumn("modified_at", "updated_at")
    .execute();

  await db.schema
    .alterTable("members")
    .renameColumn("modified_at", "updated_at")
    .execute();

  await db.schema
    .alterTable("migrations")
    .renameColumn("modified_at", "updated_at")
    .execute();

  await db.schema
    .alterTable("tenants")
    .renameColumn("modified_at", "updated_at")
    .execute();

  await db.schema
    .alterTable("users")
    .renameColumn("modified_at", "updated_at")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("applications")
    .renameColumn("updated_at", "modified_at")
    .execute();

  await db.schema
    .alterTable("connections")
    .renameColumn("updated_at", "modified_at")
    .execute();

  await db.schema
    .alterTable("domains")
    .renameColumn("updated_at", "modified_at")
    .execute();

  await db.schema
    .alterTable("members")
    .renameColumn("updated_at", "modified_at")
    .execute();

  await db.schema
    .alterTable("migrations")
    .renameColumn("updated_at", "modified_at")
    .execute();

  await db.schema
    .alterTable("tenants")
    .renameColumn("updated_at", "modified_at")
    .execute();

  await db.schema
    .alterTable("users")
    .renameColumn("updated_at", "modified_at")
    .execute();
}
