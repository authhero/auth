import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("logs")
    .addColumn("user_name", "varchar(255)")
    .execute();

  // I do not think this will be long enough
  await db.schema
    .alterTable("logs")
    .addColumn("auth0_client", "varchar(255)")
    .execute();
  await db.schema.alterTable("logs").addColumn("isMobile", "boolean").execute;
  await db.schema.alterTable("logs").addColumn("connection", "varchar(255)")
    .execute;
  await db.schema.alterTable("logs").addColumn("connection_id", "varchar(255)")
    .execute;
  await db.schema.alterTable("logs").addColumn("audience", "varchar(255)")
    .execute;
  await db.schema.alterTable("logs").addColumn("scope", "varchar(255)").execute;
  await db.schema.alterTable("logs").addColumn("strategy", "varchar(255)")
    .execute;
  await db.schema.alterTable("logs").addColumn("strategy_type", "varchar(255)")
    .execute;
  await db.schema.alterTable("logs").addColumn("hostname", "varchar(255)")
    .execute;
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("logs").dropColumn("details").execute();

  await db.schema.alterTable("logs").dropColumn("user_name");
  // TODO - add these here too!
}
