import { TicketsAdapter } from "@authhero/adapter-interfaces";
import { Kysely } from "kysely";
import { get } from "./get";
import { create } from "./create";
import { remove } from "./remove";
import { Database } from "../db";

export function createTicketsAdapter(db: Kysely<Database>): TicketsAdapter {
  return {
    create: create(db),
    get: get(db),
    remove: remove(db),
  };
}
