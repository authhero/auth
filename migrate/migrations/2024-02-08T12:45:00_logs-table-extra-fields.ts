import { Kysely } from "kysely";
import { Database } from "../../src/adapters/kysely/db";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("logs")
    .addColumn("user_name", "varchar(255)")
    .execute();
  await db.schema
    .alterTable("logs")
    .addColumn("auth0_client", "varchar(255)")
    .execute();
  await db.schema.alterTable("logs").addColumn("isMobile", "boolean").execute();
  await db.schema
    .alterTable("logs")
    .addColumn("connection", "varchar(255)")
    .execute();
  await db.schema
    .alterTable("logs")
    .addColumn("connection_id", "varchar(255)")
    .execute();
  await db.schema
    .alterTable("logs")
    .addColumn("audience", "varchar(255)")
    .execute();
  await db.schema
    .alterTable("logs")
    .addColumn("scope", "varchar(255)")
    .execute();
  await db.schema
    .alterTable("logs")
    .addColumn("strategy", "varchar(255)")
    .execute();
  await db.schema
    .alterTable("logs")
    .addColumn("strategy_type", "varchar(255)")
    .execute();
  await db.schema
    .alterTable("logs")
    .addColumn("hostname", "varchar(255)")
    .execute();
  await db.schema
    .alterTable("logs")
    .addColumn("session_connection", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("logs").dropColumn("user_name").execute();
  await db.schema.alterTable("logs").dropColumn("auth0_client").execute();
  await db.schema.alterTable("logs").dropColumn("isMobile").execute();
  await db.schema.alterTable("logs").dropColumn("connection").execute();
  await db.schema.alterTable("logs").dropColumn("connection_id").execute();
  await db.schema.alterTable("logs").dropColumn("audience").execute();
  await db.schema.alterTable("logs").dropColumn("scope").execute();
  await db.schema.alterTable("logs").dropColumn("strategy").execute();
  await db.schema.alterTable("logs").dropColumn("strategy_type").execute();
  await db.schema.alterTable("logs").dropColumn("hostname").execute();
  await db.schema.alterTable("logs").dropColumn("session_connection").execute();
}
