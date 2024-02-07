import { SqlConnection } from "../../types";

export type CreateConnectionParams = Omit<SqlConnection, "tenant_id">;

export interface ConnectionsAdapter {
  create(
    tenant_id: string,
    params: CreateConnectionParams,
  ): Promise<SqlConnection>;
}
