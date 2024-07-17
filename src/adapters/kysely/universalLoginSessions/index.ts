import { Database } from "../../../types";
import { get } from "./get";
import { create } from "./create";
import { update } from "./update";
import { Kysely } from "kysely";
import { UniversalLoginSessionsAdapter } from "@authhero/adapter-interfaces";

export function createUniversalLoginSessionAdapter(
  db: Kysely<Database>,
): UniversalLoginSessionsAdapter {
  return {
    create: create(db),
    get: get(db),
    update: update(db),
  };
}
