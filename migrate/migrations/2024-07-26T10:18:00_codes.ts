import { Kysely } from "kysely";
import { Database } from "@authhero/kysely-adapter";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("logins")
    .addColumn("login_id", "varchar(255)", (col) => col.primaryKey())
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("authParams_client_id", "varchar(255)", (col) => col.notNull())
    .addColumn("authParams_vendor_id", "varchar(255)")
    .addColumn("authParams_username", "varchar(255)")
    .addColumn("authParams_response_type", "varchar(255)")
    .addColumn("authParams_response_mode", "varchar(255)")
    .addColumn("authParams_audience", "varchar(255)")
    .addColumn("authParams_scope", "varchar(511)")
    .addColumn("authParams_state", "varchar(511)")
    .addColumn("authParams_code_challenge_method", "varchar(256)")
    .addColumn("authParams_code_challenge", "varchar(256)")
    .addColumn("authParams_redirect_uri", "varchar(256)")
    .addColumn("created_at", "varchar(255)", (col) => col.notNull())
    .addColumn("updated_at", "varchar(255)", (col) => col.notNull())
    .addColumn("expires_at", "varchar(255)", (col) => col.notNull())
    .execute();

  await db.schema
    .alterTable("passwords")
    .addColumn("algorithm", "varchar(16)")
    .execute();

  await db.schema.dropTable("codes").execute();

  await db.schema
    .createTable("codes")
    .addColumn("code_id", "varchar(255)", (col) => col.primaryKey())
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("user_id", "varchar(255)")
    .addColumn("login_id", "varchar(255)")
    .addForeignKeyConstraint(
      "codes_user_id_tenant_id_constraint",
      ["user_id", "tenant_id"],
      "users",
      ["user_id", "tenant_id"],
      (cb) => cb.onDelete("cascade"),
    )
    .addColumn("code_type", "varchar(255)", (col) => col.notNull())
    .addColumn("created_at", "varchar(255)", (col) => col.notNull())
    .addColumn("expires_at", "varchar(255)", (col) => col.notNull())
    .addColumn("used_at", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("logins").execute();

  await db.schema.alterTable("passwords").dropColumn("algorithm").execute();

  await db.schema.dropTable("codes").execute();

  await db.schema
    .createTable("codes")
    .addColumn("id", "varchar(255)", (col) => col.primaryKey())
    .addColumn("code", "varchar(255)", (col) => col.notNull())
    .addColumn("user_id", "varchar(255)")
    .addColumn("tenant_id", "varchar(255)")
    .addForeignKeyConstraint(
      "codes_user_id_tenant_id_constraint",
      ["user_id", "tenant_id"],
      "users",
      ["user_id", "tenant_id"],
      (cb) => cb.onDelete("cascade"),
    )
    .addColumn("type", "varchar(255)", (col) => col.notNull())
    .addColumn("created_at", "varchar(255)", (col) => col.notNull())
    .addColumn("expires_at", "varchar(255)", (col) => col.notNull())
    .addColumn("used_at", "varchar(255)")
    .execute();
}
