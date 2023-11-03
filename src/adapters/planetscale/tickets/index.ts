import { TicketsAdapter } from "../../interfaces/Tickets";
import { getDb } from "../../../services/db";
import { Env } from "../../../types";
import { get } from "./get";
import { create } from "./create";

export function createTicketsAdapter(env: Env): TicketsAdapter {
  const db = getDb(env);

  return {
    create: create(db),
    get: get(db),
  };
}
