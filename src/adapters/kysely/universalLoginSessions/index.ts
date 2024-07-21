import { get } from "./get";
import { create } from "./create";
import { update } from "./update";
import { Kysely } from "kysely";
import { UniversalLoginSessionsAdapter } from "@authhero/adapter-interfaces";
import { Database } from "../db";

export function createUniversalLoginSessionAdapter(
  db: Kysely<Database>,
): UniversalLoginSessionsAdapter {
  return {
    create: create(db),
    get: get(db),
    update: update(db),
  };
}
