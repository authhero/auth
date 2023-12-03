import { Migrator } from "kysely";
import "dotenv/config";

import ReferenceMigrationProvider from "./ReferenceMigrationProvider";
import migrations from "./migrations";
import { getDb } from "../src/services/db";

// import { PlanetScaleDialect } from "kysely-planetscale";
import { BunSqliteDialect } from "kysely-bun-sqlite";
import * as bunSqlite from "bun:sqlite";

console.log("migrating...");

// const dialect = new PlanetScaleDialect({
//   host: process.env.DATABASE_HOST,
//   username: process.env.DATABASE_USERNAME,
//   password: process.env.DATABASE_PASSWORD,
//   fetch: (opts, init) =>
//     fetch(new Request(opts, { ...init, cache: undefined })),
// });

const dialect = new BunSqliteDialect({
  database: new bunSqlite.Database("db.sqlite"),
});

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

async function migrateDown() {
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
  await db.destroy();
}

migrateToLatest()
  // migrateDown()
  .then(() => {
    console.log("done");
  })
  .catch((err) => {
    console.error(err);
  });
