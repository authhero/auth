import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("tenants")
    .addColumn("id", "varchar", (col) => col.notNull().primaryKey())
    .addColumn("name", "varchar")
    .addColumn("audience", "varchar")
    .addColumn("sender_email", "varchar")
    .addColumn("sender_name", "varchar")
    .addColumn("created_at", "varchar")
    .addColumn("modified_at", "varchar")
    .execute();

  await db.schema
    .createTable("users")
    .addColumn("id", "varchar", (col) => col.notNull())
    .addColumn("tenant_id", "varchar", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("email", "varchar", (col) => col.notNull())
    .addColumn("linked_to", "varchar")
    .addColumn("given_name", "varchar")
    .addColumn("family_name", "varchar")
    .addColumn("nickname", "varchar")
    .addColumn("name", "varchar")
    .addColumn("picture", "varchar")
    .addColumn("created_at", "varchar")
    .addColumn("modified_at", "varchar")
    .addPrimaryKeyConstraint("users_tenants", ["id", "tenant_id"])
    .execute();

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

  await db.schema
    .createTable("applications")
    .addColumn("id", "varchar", (col) => col.notNull().primaryKey())
    .addColumn("tenant_id", "varchar", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
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

  await db.schema
    .createTable("connections")
    .addColumn("id", "varchar", (col) => col.notNull().primaryKey())
    .addColumn("tenant_id", "varchar", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("client_id", "varchar")
    .addColumn("client_secret", "varchar")
    .addColumn("authorization_endpoint", "varchar")
    .addColumn("token_endpoint", "varchar")
    .addColumn("created_at", "varchar")
    .addColumn("modified_at", "varchar")
    .execute();

  await db.schema
    .createTable("migrations")
    .addColumn("id", "varchar", (col) => col.notNull().primaryKey())
    .addColumn("tenant_id", "varchar", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("provider", "varchar")
    .addColumn("client_id", "varchar")
    .addColumn("origin", "varchar")
    .addColumn("domain", "varchar")
    .addColumn("created_at", "varchar")
    .addColumn("modified_at", "varchar")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("members").execute();
  await db.schema.dropTable("users").execute();
  await db.schema.dropTable("connections").execute();
  await db.schema.dropTable("applications").execute();
  await db.schema.dropTable("migrations").execute();
  await db.schema.dropTable("tenants").execute();
}
