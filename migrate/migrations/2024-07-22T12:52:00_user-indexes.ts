import { Kysely } from "kysely";
import { Database } from "../../src/adapters/kysely/db";

export async function up(db: Kysely<Database>): Promise<void> {
  // Run this is the console to update the user indexes
  // ALTER TABLE users DROP PRIMARY KEY;
  // ALTER TABLE users MODIFY user_id VARCHAR(255) NOT NULL;
  // ALTER TABLE users ADD PRIMARY KEY (tenant_id, user_id);
}

export async function down(db: Kysely<Database>): Promise<void> {
  // Run this is the console to update the user indexes
  // ALTER TABLE users DROP PRIMARY KEY;
  // ALTER TABLE users ADD PRIMARY KEY (tenant_id, id);
}