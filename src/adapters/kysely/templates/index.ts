import { create } from "./create";
import { Database } from "../../../types";
import { Kysely } from "kysely";
import { TemplatesAdapter } from "../../interfaces/Templates";
import { get } from "./get";

export function createTemplatesAdapter(db: Kysely<Database>): TemplatesAdapter {
  return {
    // create: create(db),
    get: get(db),
  };
}
