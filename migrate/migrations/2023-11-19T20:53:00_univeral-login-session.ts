import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("universal_login_sessions")
    .addColumn("id", "varchar(255)", (col) => col.primaryKey())
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("client_id", "varchar(255)", (col) => col.notNull())
    .addColumn("username", "varchar(255)")
    .addColumn("response_type", "varchar(255)")
    .addColumn("response_mode", "varchar(255)")
    .addColumn("audience", "varchar(255)")
    .addColumn("scope", "varchar(511)")
    .addColumn("state", "varchar(511)")
    .addColumn("code_challenge_method", "varchar(256)")
    .addColumn("code_challenge", "varchar(256)")
    .addColumn("redirect_uri", "varchar(256)")
    .addColumn("created_at", "varchar(255)", (col) => col.notNull())
    .addColumn("updated_at", "varchar(255)", (col) => col.notNull())
    .addColumn("expires_at", "varchar(255)", (col) => col.notNull())
    // is this column on planetscale? check! added for SQLite tests
    .addColumn("nonce", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("universal_login_sessions").execute();
}
