import { Kysely } from "kysely";
import { Database } from "../../src/adapters/kysely/db";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createIndex("logs_user_id")
    .on("logs")
    .column("user_id")
    .execute();

  await db.schema
    .createIndex("logs_tenant_id")
    .on("logs")
    .column("tenant_id")
    .execute();

  await db.schema.createIndex("logs_date").on("logs").column("date").execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropIndex("logs_user_id");
  await db.schema.dropIndex("logs_tenant_id");
  await db.schema.dropIndex("logs_date");
}
