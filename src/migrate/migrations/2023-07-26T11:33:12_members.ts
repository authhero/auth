import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("members")
    .addColumn("id", "varchar", (col) => col.notNull().primaryKey())
    .addColumn("tenant_id", "varchar", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("sub", "varchar")
    .addColumn("email", "varchar")
    .addColumn("name", "varchar")
    .addColumn("status", "varchar")
    .addColumn("role", "varchar")
    .addColumn("picture", "varchar")
    .addColumn("created_at", "varchar")
    .addColumn("modified_at", "varchar")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("members").execute();
}
