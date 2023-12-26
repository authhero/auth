import { Kysely } from "kysely";
import { Database } from "../../../types";
import { list } from "./list";
import { KeysAdapter } from "../../interfaces/Keys";
import { create } from "./create";

export function createKeysAdapter(db: Kysely<Database>): KeysAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
