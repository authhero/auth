import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("passwords")
    // .addColumn("tenant_id", "varchar(255)", (col) =>
    //   col.references("tenants.id").onDelete("cascade").notNull(),
    // )
    // .addColumn("user_id", "varchar(255)", (col) =>
    //   col.references("user.id").onDelete("cascade").primaryKey(),
    // )
    .addColumn("tenant_id", "varchar(255)")
    .addColumn("user_id", "varchar(255)")
    .addForeignKeyConstraint(
      "user_id_constraint",
      ["user_id", "tenant_id"],
      "users",
      ["id", "tenant_id"],
      // TODO - add cascading delete on all the addForeignKeyConstraint
    )
    .addColumn("created_at", "varchar(255)")
    .addColumn("updated_at", "varchar(255)")
    .execute();

  await db.schema
    .createTable("codes")
    .addColumn("id", "varchar(255)", (col) => col.primaryKey())
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("user_id", "varchar(255)", (col) =>
      col.references("user.id").onDelete("cascade").notNull(),
    )
    .addColumn("type", "varchar(255)", (col) => col.notNull())
    .addColumn("created_at", "varchar(255)", (col) => col.notNull())
    .addColumn("expires_at", "varchar(255)", (col) => col.notNull())
    .addColumn("used_at", "varchar(255)")
    .execute();

  await db.schema
    .createIndex("codes_expires_at_index")
    .on("codes")
    .column("expires_at")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("passwords").execute();
  await db.schema.dropTable("codes").execute();
}
