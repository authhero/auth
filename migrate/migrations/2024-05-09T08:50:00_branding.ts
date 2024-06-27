import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("branding")
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull().primaryKey(),
    )
    .addColumn("logo_url", "varchar(512)")
    .addColumn("favicon_url", "varchar(512)")
    .addColumn("font_url", "varchar(512)")
    .addColumn("colors_primary", "varchar(8)")
    .addColumn("colors_page_background_type", "varchar(32)")
    .addColumn("colors_page_background_start", "varchar(8)")
    .addColumn("colors_page_background_end", "varchar(8)")
    .addColumn("colors_page_background_angle_dev", "integer")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("branding").execute();
}
