import { ConnectionsAdapter } from "../../interfaces/Connections";
import { SqlConnection } from "../../../types";
import { create } from "./create";

export function createConnectionsAdapter(): ConnectionsAdapter {
  const connections: SqlConnection[] = [];

  return {
    create: create(connections),
  };
}
