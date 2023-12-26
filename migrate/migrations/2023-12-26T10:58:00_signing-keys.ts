import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("keys")
    .addColumn("id", "varchar(255)", (col) => col.primaryKey())
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("private_key", "varchar(8192)")
    .addColumn("public_key", "varchar(1024)")
    .addColumn("created_at", "varchar(255)")
    .addColumn("activate_at", "varchar(255)")
    .addColumn("revoked_at", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("keys");
}
