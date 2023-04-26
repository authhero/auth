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
    .execute();

  await db.schema
    .createTable("organizations")
    .addColumn("id", "varchar", (col) => col.notNull().primaryKey())
    .addColumn("name", "varchar")
    .addColumn("created_at", "varchar")
    .addColumn("modified_at", "varchar")
    .execute();

  await db.schema
    .createTable("users_organizations")
    .addColumn("user_id", "varchar", (col) =>
      col.references("users.id").onDelete("cascade").notNull()
    )
    .addColumn("organization_id", "varchar", (col) =>
      col.references("organizations.id").onDelete("cascade").notNull()
    )
    .addColumn("created_at", "varchar")
    .addColumn("modified_at", "varchar")
    .addPrimaryKeyConstraint("users_organizations", [
      "user_id",
      "organization_id",
    ])
    .execute();

  await db.schema
    .createTable("tenants")
    .addColumn("id", "varchar", (col) => col.notNull().primaryKey())
    .addColumn("organization_id", "varchar", (col) =>
      col.references("organizations.id").onDelete("cascade").notNull()
    )
    .addColumn("name", "varchar")
    .addColumn("created_at", "varchar")
    .addColumn("modified_at", "varchar")
    .execute();

  await db.schema
    .createTable("applications")
    .addColumn("id", "varchar", (col) => col.notNull().primaryKey())
    .addColumn("tenant_id", "varchar", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull()
    )
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("client_id", "varchar")
    .addColumn("client_secret", "varchar")
    .addColumn("allowed_callback_urls", "varchar")
    .addColumn("allowed_logout_urls", "varchar")
    .addColumn("allowed_web_origins", "varchar")
    .addColumn("authentication_settings", "varchar")
    .addColumn("styling_settings", "varchar")
    .addColumn("created_at", "varchar")
    .addColumn("modified_at", "varchar")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // await db.schema.dropTable("users_organizations").execute();
  // await db.schema.dropTable("users").execute();
  // await db.schema.dropTable("applications").execute();
  // await db.schema.dropTable("tenants").execute();
  await db.schema.dropTable("organizations").execute();
}
