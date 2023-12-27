import { Kysely } from "kysely";
import { Database } from "../../../types";
import { list } from "./list";
import { KeysAdapter } from "../../interfaces/Keys";
import { create } from "./create";
import { revoke } from "./revoke";

export function createKeysAdapter(db: Kysely<Database>): KeysAdapter {
  return {
    create: create(db),
    list: list(db),
    revoke: revoke(db),
  };
}
