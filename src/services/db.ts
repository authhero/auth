import { Dialect, Kysely } from "kysely";
// import { D1Dialect } from "kysely-d1";
import { Database } from "../adapters/kysely/db";
import { Env } from "../types/Env";
import { PlanetScaleDialect } from "kysely-planetscale";

let _db: Kysely<Database>;

// A temporary endpoint until we are migrated to data adapters
export function getDbFromEnv(env: Env): Kysely<Database> {
  const dialect = new PlanetScaleDialect({
    host: env.DATABASE_HOST,
    username: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    fetch: (opts, init) =>
      fetch(new Request(opts, { ...init, cache: undefined })),
  });

  return getDb(dialect);
}

export function getDb(dialect: Dialect): Kysely<Database> {
  if (!_db) {
    _db = new Kysely<any>({
      dialect,
    });
  }

  return _db;
}
