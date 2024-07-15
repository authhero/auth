import { Database } from "../../../types";
import { list } from "./list";
import { create } from "./create";
import { Kysely } from "kysely";
import { HooksAdapter } from "../../interfaces/Hooks";
import { update } from "./update";

export function createHooksAdapter(db: Kysely<Database>): HooksAdapter {
  return {
    create: create(db),
    list: list(db),
    update: update(db),
  };
}
