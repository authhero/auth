import { SessionsAdapter } from "@authhero/adapter-interfaces";
import { Database } from "../../../types";
import { get } from "./get";
import { create } from "./create";
import { Kysely } from "kysely";
import { remove } from "./remove";
import { update } from "./update";
import { list } from "./list";

export function createSessionsAdapter(db: Kysely<Database>): SessionsAdapter {
  return {
    create: create(db),
    get: get(db),
    list: list(db),
    remove: remove(db),
    update: update(db),
  };
}
