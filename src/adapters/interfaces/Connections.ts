import { SqlConnection } from "../../types";

export type CreateConnectionParams = SqlConnection;

export interface ConnectionsAdapter {
  create(
    tenant_id: string,
    params: CreateConnectionParams,
  ): Promise<SqlConnection>;
}
