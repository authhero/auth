import { CreateConnectionParams } from "../../interfaces/Connections";
import { SqlConnection } from "../../../types";

export function create(connections: SqlConnection[]) {
  return async (tenant_id: string, params: CreateConnectionParams) => {
    const connection: SqlConnection = {
      ...params,
      tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    connections.push(connection);

    return connection;
  };
}
