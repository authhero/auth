import { Kysely } from "kysely";
import { Database } from "@authhero/kysely-adapter";

export async function up(db: Kysely<Database>): Promise<void> {
  // await db.schema
  //   .alterTable("logs")
  //   .addColumn("ip", "varchar(255)")
  //   .addColumn("type", "varchar(255)")
  //   .addColumn("date", "varchar(255)")
  //   .addColumn("description", "varchar(255)")
  //   .addColumn("client_id", "varchar(255)")
  //   .addColumn("client_name", "varchar(255)")
  //   .addColumn("user_agent", "varchar(255)")
  //   .addColumn("details", "varchar(2048)")
  //   .dropColumn("timestamp")
  //   .dropColumn("message")
  //   .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  // await db.schema
  //   .alterTable("logs")
  //   .dropColumn("ip")
  //   .dropColumn("type")
  //   .dropColumn("date")
  //   .dropColumn("description")
  //   .dropColumn("client_id")
  //   .dropColumn("client_name")
  //   .dropColumn("user_agent")
  //   .dropColumn("details")
  //   .addColumn("timestamp", "varchar(255)")
  //   .addColumn("message", "varchar(255)")
  //   .execute();
}
