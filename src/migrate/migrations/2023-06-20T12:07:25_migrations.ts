import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // export interface Migration {
  //   id: string;
  //   provider: string;
  //   tenantId: string;
  //   clientId: string;
  //   clientSecret: string;
  //   audience: string;
  //   origin: string;
  //   domain: string;
  //   createdAt: string;
  //   modifiedAt: string;
  // }

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
  await db.schema.dropTable("migrations").execute();
}
