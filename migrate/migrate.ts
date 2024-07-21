import { Dialect, Kysely, Migrator } from "kysely";
import "dotenv/config";

import ReferenceMigrationProvider from "./ReferenceMigrationProvider";
import migrations from "./migrations";
import { getDb } from "../src/services/db";
import { Database } from "../src/adapters/kysely/db";

export async function migrateToLatest(
  dialect: Dialect,
  debug = true,
  db?: Kysely<Database>,
) {
  if (debug) {
    console.log("migrating...");
  }

  const provider = new ReferenceMigrationProvider(migrations);

  if (!db) {
    db = getDb(dialect);
  }

  const migrator = new Migrator({
    db,
    provider,
  });
  const { error, results } = await migrator.migrateToLatest();
  results?.forEach((it) => {
    if (it.status === "Success") {
      if (debug) {
        console.log(
          `migration "${it.migrationName}" was executed successfully`,
        );
      }
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });
  if (error) {
    console.error("failed to migrate");
    console.error(error);
    throw error;
  }
}

export async function migrateDown(dialect: Dialect) {
  console.log("migrating...");

  const provider = new ReferenceMigrationProvider(migrations);
  const db = getDb(dialect);
  const migrator = new Migrator({
    db,
    provider,
  });
  const { error, results } = await migrator.migrateDown();
  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was reverted successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });
  if (error) {
    console.error("failed to migrate");
    console.error(error);
    throw error;
  }
}
