import { Kysely } from "kysely";
import { Database } from "../../types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("logs")
    .addColumn("id", "varchar(255)", (col) => col.notNull().primaryKey())
    .addColumn("client_id", "varchar(255)", (col) =>
      col.references("clients.id").onDelete("cascade").notNull(),
    )
    .addColumn("timestamp", "varchar(255)", (col) => col.notNull())
    .addColumn("category", "varchar(255)", (col) => col.notNull())
    .addColumn("message", "varchar(255)", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("logs").execute();
}