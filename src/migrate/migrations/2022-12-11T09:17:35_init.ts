import { Kysely } from "kysely";
import { Database } from "../../types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("tenants")
    .addColumn("id", "varchar(255)", (col) => col.primaryKey())
    .addColumn("name", "varchar(255)")
    .addColumn("audience", "varchar(255)")
    .addColumn("sender_email", "varchar(255)")
    .addColumn("sender_name", "varchar(255)")
    .addColumn("created_at", "varchar(255)")
    .addColumn("modified_at", "varchar(255)")
    .execute();

  await db.schema
    .createTable("users")
    .addColumn("id", "varchar(255)", (col) => col.notNull())
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("email", "varchar(255)", (col) => col.notNull())
    .addColumn("linked_to", "varchar(255)")
    .addColumn("given_name", "varchar(255)")
    .addColumn("family_name", "varchar(255)")
    .addColumn("nickname", "varchar(255)")
    .addColumn("name", "varchar(255)")
    .addColumn("picture", "varchar(255)")
    .addColumn("tags", "varchar(255)")
    .addColumn("created_at", "varchar(255)")
    .addColumn("modified_at", "varchar(255)")
    .addPrimaryKeyConstraint("users_tenants", ["id", "tenant_id"])
    .execute();

  await db.schema
    .createTable("members")
    .addColumn("id", "varchar(255)", (col) => col.notNull().primaryKey())
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("sub", "varchar(255)")
    .addColumn("email", "varchar(255)")
    .addColumn("name", "varchar(255)")
    .addColumn("status", "varchar(255)")
    .addColumn("role", "varchar(255)")
    .addColumn("picture", "varchar(255)")
    .addColumn("created_at", "varchar(255)")
    .addColumn("modified_at", "varchar(255)")
    .execute();

  await db.schema
    .createTable("applications")
    .addColumn("id", "varchar(255)", (col) => col.notNull().primaryKey())
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("client_secret", "varchar(255)")
    .addColumn("allowed_callback_urls", "varchar(255)")
    .addColumn("allowed_logout_urls", "varchar(255)")
    .addColumn("allowed_web_origins", "varchar(255)")
    .addColumn("authentication_settings", "varchar(255)")
    .addColumn("styling_settings", "varchar(255)")
    .addColumn("email_validation", "varchar(255)")
    // .addColumn("two_factor_authentication", "varchar(255)")
    // .addColumn("enable_signup", "boolean")
    .addColumn("created_at", "varchar(255)")
    .addColumn("modified_at", "varchar(255)")
    .execute();

  await db.schema
    .createTable("connections")
    .addColumn("id", "varchar(255)", (col) => col.notNull().primaryKey())
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("client_id", "varchar(255)")
    .addColumn("client_secret", "varchar(255)")
    .addColumn("authorization_endpoint", "varchar(255)")
    .addColumn("token_endpoint", "varchar(255)")
    .addColumn("created_at", "varchar(255)")
    .addColumn("modified_at", "varchar(255)")
    .execute();

  await db.schema
    .createTable("migrations")
    .addColumn("id", "varchar(255)", (col) => col.notNull().primaryKey())
    .addColumn("tenant_id", "varchar(255)", (col) =>
      col.references("tenants.id").onDelete("cascade").notNull(),
    )
    .addColumn("provider", "varchar(255)")
    .addColumn("client_id", "varchar(255)")
    .addColumn("origin", "varchar(255)")
    .addColumn("domain", "varchar(255)")
    .addColumn("created_at", "varchar(255)")
    .addColumn("modified_at", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("members").execute();
  await db.schema.dropTable("users").execute();
  await db.schema.dropTable("connections").execute();
  await db.schema.dropTable("applications").execute();
  await db.schema.dropTable("migrations").execute();
  await db.schema.dropTable("tenants").execute();
}
