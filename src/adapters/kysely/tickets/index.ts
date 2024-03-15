import { TicketsAdapter } from "../../interfaces/Tickets";
import { Database } from "../../../types";
import { get } from "./get";
import { create } from "./create";
import { remove } from "./remove";
import { Kysely } from "kysely";

export function createTicketsAdapter(db: Kysely<Database>): TicketsAdapter {
  return {
    create: create(db),
    get: get(db),
    remove: remove(db),
  };
}
