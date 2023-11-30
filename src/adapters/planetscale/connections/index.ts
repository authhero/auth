import { ConnectionsAdapter } from "../../interfaces/Connections";
import { create } from "./create";
import { getDb } from "../../../services/db";
import { Env } from "../../../types";

export function createConnectionsAdapter(env: Env): ConnectionsAdapter {
  const db = getDb(env);

  return {
    create: create(db),
  };
}
