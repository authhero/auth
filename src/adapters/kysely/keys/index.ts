import { Kysely } from "kysely";
import { KeysAdapter } from "@authhero/adapter-interfaces";
import { list } from "./list";
import { create } from "./create";
import { revoke } from "./revoke";
import { Database } from "../db";

export function createKeysAdapter(db: Kysely<Database>): KeysAdapter {
  return {
    create: create(db),
    list: list(db),
    revoke: revoke(db),
  };
}
