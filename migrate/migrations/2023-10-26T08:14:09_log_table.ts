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
    .addColumn("timestamp", "varchar(255)", (col) => col.notNull())
    .addColumn("category", "varchar(255)", (col) => col.notNull())
    .addColumn("message", "varchar(255)", (col) => col.notNull())
    // Added in later migration
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("user_id", "varchar(255)", (col) =>
      col.references("users.id").onDelete("cascade").notNull(),
    )
    // End added columns
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("logs").execute();
}
