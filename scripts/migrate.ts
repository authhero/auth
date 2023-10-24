import { Dialect, Kysely, Migrator } from "kysely";
import { BunWorkerDialect } from "kysely-bun-worker";

import { Database } from "../src/types";
import ReferenceMigrationProvider from "../src/migrate/ReferenceMigrationProvider";
import migrations from "../src/migrate/migrations";

console.log("migrating...");

const dialect = new BunWorkerDialect({
  url: "test.db",
});

let _db: Kysely<Database>;

function getDb(dialect: Dialect): Kysely<Database> {
  if (!_db) {
    _db = new Kysely<Database>({
      dialect,
    });
  }

  return _db;
}

async function migrateToLatest() {
  const provider = new ReferenceMigrationProvider(migrations);
  const db = getDb(dialect);
  const migrator = new Migrator({
    db,
    provider,
  });
  const { error, results } = await migrator.migrateToLatest();
  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });
  if (error) {
    console.error("failed to migrate");
    console.error(error);
    throw error;
  }
  await db.destroy();
}

migrateToLatest()
  .then(() => {
    console.log("done");
  })
  .catch((err) => {
    console.error(err);
  });
