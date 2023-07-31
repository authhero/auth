import {
  CamelCasePlugin,
  Kysely,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  RootOperationNode,
  UnknownRow,
} from "kysely";
import { D1Dialect } from "kysely-d1";
import { Database } from "../types/sql/db";
import { Env } from "../types/Env";

let _db: Kysely<Database>;

export function getDb(env: Env): Kysely<Database> {
  if (!_db) {
    _db = new Kysely<Database>({
      dialect: new D1Dialect({ database: env.AUTH_DB }),
      plugins: [new CamelCasePlugin()],
    });
  }

  return _db;
}
