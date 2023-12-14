import { ConnectionsAdapter } from "../../interfaces/Connections";
import { SqlConnection } from "../../../types";
import { create } from "./create";

export function createConnectionsAdapter(
  connections: SqlConnection[],
): ConnectionsAdapter {
  return {
    create: create(connections),
  };
}
