import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("branding")
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull().primaryKey(),
    )
    .addColumn("colors_type", "varchar(32)")
    .addColumn("logo_url", "varchar(512)")
    .addColumn("colors_start", "varchar(8)")
    .addColumn("colors_end", "varchar(8)")
    .addColumn("colors_angle_dev", "integer")
    .addColumn("favicon_url", "varchar(512)")
    .addColumn("font_url", "varchar(512)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("branding").execute();
}
