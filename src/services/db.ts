import { Kysely } from "kysely";
// import { D1Dialect } from "kysely-d1";
import { Database } from "../types/sql/db";
import { Env } from "../types/Env";
import { PlanetScaleDialect } from "kysely-planetscale";

let _db: Kysely<Database>;

export function getDb(env: Env): Kysely<Database> {
  if (!_db) {
    // _db = new Kysely<Database>({
    //   dialect: new D1Dialect({ database: env.AUTH_DB }),
    // });
    _db = new Kysely<any>({
      dialect: new PlanetScaleDialect({
        host: env.DATABASE_HOST,
        username: env.DATABASE_USERNAME,
        password: env.DATABASE_PASSWORD,
        fetch: (opts, init) =>
          fetch(new Request(opts, { ...init, cache: undefined })),
      }),
    });
  }

  return _db;
}
