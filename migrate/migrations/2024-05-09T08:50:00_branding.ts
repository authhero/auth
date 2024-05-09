import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("branding")
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull().primaryKey(),
    )
    .addColumn("colors", "varchar(512)")
    .addColumn("logo_url", "varchar(512)")
    .addColumn("favicon_url", "varchar(512)")
    .addColumn("font", "varchar(512)")
    .addColumn("created_at", "varchar(255)")
    .addColumn("modified_at", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("branding").execute();
}
