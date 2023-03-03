import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("users")
    .addColumn("id", "varchar", (col) => col.notNull().primaryKey())
    .addColumn("client_id", "varchar", (col) => col.notNull())
    .addColumn("email", "varchar", (col) => col.notNull())
    .addColumn("linked_to", "varchar")
    .addColumn("first_name", "varchar")
    .addColumn("last_name", "varchar")
    .addColumn("created_at", "varchar")
    .addColumn("modified_at", "varchar")

    // .addColumn("created_at", "timestamp", (col) =>
    //   col.defaultTo(sql`now()`).notNull()
    // )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("users").execute();
}
