import { Kysely } from "kysely";
import { Database } from "@authhero/kysely-adapter";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("authentication_codes")
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("code", "varchar(255)", (col) => col.primaryKey())
    .addColumn("client_id", "varchar(255)", (col) =>
      col.references("applications.id").onDelete("cascade").notNull(),
    )
    .addColumn("user_id", "varchar(255)", (col) => col.notNull())
    .addColumn("nonce", "varchar(255)")
    .addColumn("state", "varchar(8192)")
    .addColumn("scope", "varchar(1024)")
    .addColumn("response_type", "varchar(256)")
    .addColumn("response_mode", "varchar(256)")
    .addColumn("redirect_uri", "varchar(1024)")
    .addColumn("created_at", "varchar(255)", (col) => col.notNull())
    .addColumn("expires_at", "varchar(255)", (col) => col.notNull())
    .addColumn("used_at", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("authentication_codes").execute();
}
