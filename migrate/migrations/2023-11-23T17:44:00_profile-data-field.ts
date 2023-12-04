import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("users")
    // this was the largest planetscale would let me do... was doing power of 2 down from max SQL size
    .addColumn("profileData", "varchar(2048)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("users").dropColumn("profileData").execute();
}
