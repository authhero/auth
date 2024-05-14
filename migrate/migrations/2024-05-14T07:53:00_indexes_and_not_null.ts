import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  // await db.schema
  //   .createIndex("users_tenant_index")
  //   .on("users")
  //   .column("tenant_id")
  //   .execute();
  // await db.schema.dropIndex("users_email_index").execute();
  // await db.schema
  //   .alterTable("users")
  //   .modifyColumn("created_at", "varchar(255)", (col) => col.notNull())
  //   .modifyColumn("updated_at", "varchar(255)", (col) => col.notNull())
  //   .modifyColumn("login_count", "integer", (col) => col.notNull())
  //   .modifyColumn("is_social", "boolean", (col) => col.notNull())
  //   .modifyColumn("email_verified", "boolean", (col) => col.notNull())
  //   .modifyColumn("provider", "varchar(255)", (col) => col.notNull())
  //   .execute();
  // await db.schema
  //   .alterTable("tenants")
  //   .modifyColumn("created_at", "varchar(255)", (col) => col.notNull())
  //   .modifyColumn("updated_at", "varchar(255)", (col) => col.notNull())
  //   .execute();
  // await db.schema
  //   .alterTable("applications")
  //   .modifyColumn("created_at", "varchar(255)", (col) => col.notNull())
  //   .modifyColumn("updated_at", "varchar(255)", (col) => col.notNull())
  //   .execute();
  // await db.schema
  //   .alterTable("connections")
  //   .modifyColumn("created_at", "varchar(255)", (col) => col.notNull())
  //   .modifyColumn("updated_at", "varchar(255)", (col) => col.notNull())
  //   .execute();
  // await db.schema
  //   .alterTable("members")
  //   .modifyColumn("created_at", "varchar(255)", (col) => col.notNull())
  //   .modifyColumn("updated_at", "varchar(255)", (col) => col.notNull())
  //   .execute();
  // await db.schema
  //   .alterTable("migrations")
  //   .modifyColumn("created_at", "varchar(255)", (col) => col.notNull())
  //   .modifyColumn("updated_at", "varchar(255)", (col) => col.notNull())
  //   .execute();
  // await db.schema
  //   .alterTable("domains")
  //   .modifyColumn("created_at", "varchar(255)", (col) => col.notNull())
  //   .modifyColumn("updated_at", "varchar(255)", (col) => col.notNull())
  //   .execute();
  // await db.schema
  //   .alterTable("logs")
  //   .modifyColumn("date", "varchar(255)", (col) => col.notNull())
  //   .modifyColumn("type", "varchar(255)", (col) => col.notNull())
  //   .execute();
  // await db.schema
  //   .alterTable("passwords")
  //   .modifyColumn("created_at", "varchar(255)", (col) => col.notNull())
  //   .modifyColumn("updated_at", "varchar(255)", (col) => col.notNull())
  //   .execute();
  // await db.schema
  //   .alterTable("sessions")
  //   .alterColumn("created_at", (col) => col.setNotNull())
  //   .alterColumn("expires_at", (col) => col.setNotNull())
  //   .execute();
  // await db.schema
  //   .alterTable("keys")
  //   .modifyColumn("public_key", "varchar(1024)", (col) => col.notNull())
  //   .modifyColumn("private_key", "varchar(8192)", (col) => col.notNull())
  //   .modifyColumn("created_at", "varchar(255)", (col) => col.notNull())
  //   .modifyColumn("updated_at", "varchar(255)", (col) => col.notNull())
  //   .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  // await db.schema.dropIndex("users_tenant_index").execute();
  // await db.schema
  //   .createIndex("users_email_index")
  //   .on("users")
  //   .column("email")
  //   .execute();
  // await db.schema
  //   .alterTable("users")
  //   .modifyColumn("created_at", "varchar(255)", (col) => col.notNull())
  //   .modifyColumn("updated_at", "varchar(255)")
  //   .modifyColumn("login_count", "integer")
  //   .modifyColumn("is_social", "boolean")
  //   .modifyColumn("email_verified", "boolean")
  //   .modifyColumn("provider", "varchar(255)")
  //   .execute();
  // await db.schema
  //   .alterTable("tenants")
  //   .modifyColumn("created_at", "varchar(255)")
  //   .modifyColumn("updated_at", "varchar(255)")
  //   .execute();
  // await db.schema
  //   .alterTable("applications")
  //   .modifyColumn("created_at", "varchar(255)")
  //   .modifyColumn("updated_at", "varchar(255)")
  //   .execute();
  // await db.schema
  //   .alterTable("connections")
  //   .modifyColumn("created_at", "varchar(255)")
  //   .modifyColumn("updated_at", "varchar(255)")
  //   .execute();
  // await db.schema
  //   .alterTable("members")
  //   .modifyColumn("created_at", "varchar(255)")
  //   .modifyColumn("updated_at", "varchar(255)")
  //   .execute();
  // await db.schema
  //   .alterTable("migrations")
  //   .modifyColumn("created_at", "varchar(255)")
  //   .modifyColumn("updated_at", "varchar(255)")
  //   .execute();
  // await db.schema
  //   .alterTable("domains")
  //   .modifyColumn("created_at", "varchar(255)")
  //   .modifyColumn("updated_at", "varchar(255)")
  //   .execute();
  // await db.schema
  //   .alterTable("logs")
  //   .modifyColumn("date", "varchar(255)")
  //   .modifyColumn("type", "varchar(255)")
  //   .execute();
  // await db.schema
  //   .alterTable("passwords")
  //   .modifyColumn("created_at", "varchar(255)")
  //   .modifyColumn("updated_at", "varchar(255)")
  //   .execute();
  // await db.schema
  //   .alterTable("sessions")
  //   .modifyColumn("created_at", "varchar(255)")
  //   .modifyColumn("updated_at", "varchar(255)")
  //   .execute();
  // await db.schema
  //   .alterTable("keys")
  //   .modifyColumn("public_key", "varchar(1024)")
  //   .modifyColumn("private_key", "varchar(8192)")
  //   .modifyColumn("created_at", "varchar(255)")
  //   .modifyColumn("updated_at", "varchar(255)")
  //   .execute();
}
