import { Kysely } from "kysely";
import { Database } from "../../types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("domains")
    .addColumn("id", "varchar(255)", (col) => col.notNull().primaryKey())
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("domain", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("created_at", "varchar(255)")
    .addColumn("modified_at", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("domains").execute();
}
