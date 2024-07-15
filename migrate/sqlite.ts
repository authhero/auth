import { BunSqliteDialect } from "kysely-bun-sqlite";
// @ts-ignore
import * as bunSqlite from "bun:sqlite";
import { migrateDown, migrateToLatest } from "./migrate";

const dialect = new BunSqliteDialect({
  database: new bunSqlite.Database("db.sqlite"),
});

migrateToLatest(dialect)
  // migrateDown(dialect)
  .then(() => {
    console.log("migrated");
  })
  .catch((error) => {
    console.error(error);
  });
