import { create } from "./create";
import { list } from "./list";
import { Kysely } from "kysely";
import { get } from "./get";
import { remove } from "./remove";
import { update } from "./update";
import { ApplicationsAdapter } from "@authhero/adapter-interfaces";
import { Database } from "../db";

export function createApplicationsAdapter(
  db: Kysely<Database>,
): ApplicationsAdapter {
  return {
    create: create(db),
    list: list(db),
    get: get(db),
    remove: remove(db),
    update: update(db),
  };
}
