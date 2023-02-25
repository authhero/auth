import { Context } from "cloudworker-router";
import { CamelCasePlugin, Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { Database } from "../types/db";
import { Env } from "../types/Env";

let _db: Kysely<Database>;

export function getDb(ctx: Context<Env>): Kysely<Database> {
  if (!_db) {
    _db = new Kysely<Database>({
      dialect: new D1Dialect({ database: ctx.env.AUTH_DB }),
      plugins: [new CamelCasePlugin()],
    });
  }

  return _db;
}
