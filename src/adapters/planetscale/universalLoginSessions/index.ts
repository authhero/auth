import { UniversalLoginSessionsAdapter } from "../../interfaces/UniversalLoginSession";
import { getDb } from "../../../services/db";
import { Env } from "../../../types";
import { get } from "./get";
import { create } from "./create";
import { update } from "./update";

export function createUniversalLoginSessionAdapter(
  env: Env,
): UniversalLoginSessionsAdapter {
  const db = getDb(env);

  return {
    create: create(db),
    get: get(db),
    update: update(db),
  };
}
