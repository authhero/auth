import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createIndex("users_email_index")
    .on("users")
    .column("tenant_id")
    .execute();

  await db.schema.dropIndex("users_email_index");

  await db.schema
    .alterTable("users")
    .alterColumn("created_at", (col) => col.setNotNull())
    .alterColumn("modified_at", (col) => col.setNotNull())
    .alterColumn("login_count", (col) => col.setNotNull())
    .alterColumn("is_social", (col) => col.setNotNull())
    .alterColumn("email_verified", (col) => col.setNotNull())
    .alterColumn("provider", (col) => col.setNotNull())
    .execute();

  await db.schema
    .alterTable("tenants")
    .alterColumn("created_at", (col) => col.setNotNull())
    .alterColumn("modified_at", (col) => col.setNotNull())
    .execute();

  await db.schema
    .alterTable("applications")
    .alterColumn("created_at", (col) => col.setNotNull())
    .alterColumn("modified_at", (col) => col.setNotNull())
    .execute();

  await db.schema
    .alterTable("connections")
    .alterColumn("created_at", (col) => col.setNotNull())
    .alterColumn("modified_at", (col) => col.setNotNull())
    .execute();

  await db.schema
    .alterTable("members")
    .alterColumn("created_at", (col) => col.setNotNull())
    .alterColumn("modified_at", (col) => col.setNotNull())
    .execute();

  await db.schema
    .alterTable("migrations")
    .alterColumn("created_at", (col) => col.setNotNull())
    .alterColumn("modified_at", (col) => col.setNotNull())
    .execute();

  await db.schema
    .alterTable("domains")
    .alterColumn("created_at", (col) => col.setNotNull())
    .alterColumn("modified_at", (col) => col.setNotNull())
    .execute();

  await db.schema
    .alterTable("logs")
    .alterColumn("date", (col) => col.setNotNull())
    .alterColumn("type", (col) => col.setNotNull())
    .execute();

  await db.schema
    .alterTable("passwords")
    .alterColumn("created_at", (col) => col.setNotNull())
    .alterColumn("modified_at", (col) => col.setNotNull())
    .execute();

  await db.schema
    .alterTable("sessions")
    .alterColumn("created_at", (col) => col.setNotNull())
    .alterColumn("expires_at", (col) => col.setNotNull())
    .execute();

  await db.schema
    .alterTable("keys")
    .alterColumn("public_key", (col) => col.setNotNull())
    .alterColumn("private_key", (col) => col.setNotNull())
    .alterColumn("created_at", (col) => col.setNotNull())
    .alterColumn("modified_at", (col) => col.setNotNull())
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropIndex("users_email_index").execute();

  await db.schema
    .createIndex("users_email_index")
    .on("users")
    .column("email")
    .execute();

  await db.schema
    .alterTable("users")
    .alterColumn("created_at", (col) => col.dropNotNull())
    .alterColumn("modified_at", (col) => col.dropNotNull())
    .alterColumn("login_count", (col) => col.dropNotNull())
    .alterColumn("is_social", (col) => col.dropNotNull())
    .alterColumn("email_verified", (col) => col.dropNotNull())
    .alterColumn("provider", (col) => col.dropNotNull())
    .execute();

  await db.schema
    .alterTable("tenants")
    .alterColumn("created_at", (col) => col.dropNotNull())
    .alterColumn("modified_at", (col) => col.dropNotNull())
    .execute();

  await db.schema
    .alterTable("applications")
    .alterColumn("created_at", (col) => col.dropNotNull())
    .alterColumn("modified_at", (col) => col.dropNotNull())
    .execute();

  await db.schema
    .alterTable("connections")
    .alterColumn("created_at", (col) => col.dropNotNull())
    .alterColumn("modified_at", (col) => col.dropNotNull())
    .execute();

  await db.schema
    .alterTable("members")
    .alterColumn("created_at", (col) => col.dropNotNull())
    .alterColumn("modified_at", (col) => col.dropNotNull())
    .execute();

  await db.schema
    .alterTable("migrations")
    .alterColumn("created_at", (col) => col.dropNotNull())
    .alterColumn("modified_at", (col) => col.dropNotNull())
    .execute();

  await db.schema
    .alterTable("domains")
    .alterColumn("created_at", (col) => col.dropNotNull())
    .alterColumn("modified_at", (col) => col.dropNotNull())
    .execute();

  await db.schema
    .alterTable("logs")
    .alterColumn("date", (col) => col.dropNotNull())
    .alterColumn("type", (col) => col.dropNotNull())
    .execute();

  await db.schema
    .alterTable("passwords")
    .alterColumn("created_at", (col) => col.dropNotNull())
    .alterColumn("modified_at", (col) => col.dropNotNull())
    .execute();

  await db.schema
    .alterTable("sessions")
    .alterColumn("created_at", (col) => col.dropNotNull())
    .alterColumn("expires_at", (col) => col.dropNotNull())
    .execute();

  await db.schema
    .alterTable("keys")
    .alterColumn("public_key", (col) => col.dropNotNull())
    .alterColumn("private_key", (col) => col.dropNotNull())
    .alterColumn("created_at", (col) => col.dropNotNull())
    .alterColumn("modified_at", (col) => col.dropNotNull())
    .execute();
}
