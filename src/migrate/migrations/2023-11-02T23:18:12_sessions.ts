import { Kysely } from "kysely";
import { Database } from "../../types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("sessions")
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("id", "varchar(255)", (col) => col.primaryKey())
    .addColumn("client_id", "varchar(255)", (col) =>
      col.references("appliction.id").onDelete("cascade").notNull(),
    )
    .addColumn("user_id", "varchar(255)", (col) =>
      col.references("user.id").onDelete("cascade").notNull(),
    )
    .addColumn("created_at", "varchar(255)")
    .addColumn("expires_at", "varchar(255)")
    .addColumn("user_at", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("sessions").execute();
}
