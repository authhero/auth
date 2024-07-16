import { Database } from "../../../types";
import { list } from "./list";
import { get } from "./get";
import { remove } from "./remove";
import { create } from "./create";
import { Kysely } from "kysely";
import { HooksAdapter } from "../../interfaces/Hooks";
import { update } from "./update";

export function createHooksAdapter(db: Kysely<Database>): HooksAdapter {
  return {
    create: create(db),
    get: get(db),
    list: list(db),
    update: update(db),
    remove: remove(db),
  };
}
