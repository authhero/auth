import { Kysely } from "kysely";
import { KeysAdapter } from "@authhero/adapter-interfaces";
import { Database } from "../../../types";
import { list } from "./list";
import { create } from "./create";
import { revoke } from "./revoke";

export function createKeysAdapter(db: Kysely<Database>): KeysAdapter {
  return {
    create: create(db),
    list: list(db),
    revoke: revoke(db),
  };
}
