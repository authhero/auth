import { ApplicationsAdapter } from "../../interfaces/Applications";
import { create } from "./create";
import { getDb } from "../../../services/db";
import { Env } from "../../../types";

export function createApplicationsAdapter(env: Env): ApplicationsAdapter {
  const db = getDb(env);

  return {
    create: create(db),
  };
}
