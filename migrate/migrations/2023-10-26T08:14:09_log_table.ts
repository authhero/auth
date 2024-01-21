import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("logs")
    .addColumn("id", "varchar(255)", (col) => col.notNull().primaryKey())
    // Removed in later migration
    // .addColumn("client_id", "varchar(255)", (col) =>
    //   col.references("clients.id").onDelete("cascade").notNull(),
    // )
    // .addColumn("timestamp", "varchar(255)", (col) => col.notNull())
    .addColumn("category", "varchar(255)", (col) => col.notNull())
    // .addColumn("message", "varchar(255)", (col) => col.notNull())
    // Added in later migration
    // .addColumn("tenant_id", "varchar(255)", (col) =>
    //   col.references("tenants.id").onDelete("cascade").notNull(),
    // )
    // .addColumn("user_id", "varchar(255)", (col) =>
    //   col.references("users.id").onDelete("cascade").notNull(),
    // )
    .addColumn("tenant_id", "varchar(255)")
    .addColumn("user_id", "varchar(255)")
    .addForeignKeyConstraint(
      "user_id_constraint",
      ["user_id", "tenant_id"],
      "users",
      ["id", "tenant_id"],
      (cb) => cb.onDelete("cascade"),
    )
    .addColumn("ip", "varchar(255)")
    .addColumn("type", "varchar(255)")
    .addColumn("date", "varchar(255)")
    .addColumn("client_id", "varchar(255)")
    .addColumn("client_name", "varchar(255)")
    .addColumn("user_agent", "varchar(255)")
    .addColumn("description", "varchar(255)")
    .addColumn("details", "varchar(2048)")
    // End added columns
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("logs").execute();
}
