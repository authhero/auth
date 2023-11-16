import { SessionsAdapter } from "../../interfaces/Sessions";
import { getDb } from "../../../services/db";
import { Env } from "../../../types";
import { get } from "./get";
import { create } from "./create";

export function createSessionsAdapter(env: Env): SessionsAdapter {
  const db = getDb(env);

  return {
    create: create(db),
    get: get(db),
  };
}
