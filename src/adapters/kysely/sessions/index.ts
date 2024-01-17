import { SessionsAdapter } from "../../interfaces/Sessions";
import { Database } from "../../../types";
import { get } from "./get";
import { create } from "./create";
import { Kysely } from "kysely";
import { remove } from "./remove";
import { update } from "./update";

export function createSessionsAdapter(db: Kysely<Database>): SessionsAdapter {
  return {
    create: create(db),
    get: get(db),
    remove: remove(db),
    update: update(db),
  };
}
