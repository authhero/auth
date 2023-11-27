import { SqlConnection } from "../../types";

export type CreateConnectionParams = Omit<
  SqlConnection,
  "id" | "tenant_id" | "created_at" | "updated_at"
>;

export interface ConnectionsAdapter {
  create(
    tenant_id: string,
    params: CreateConnectionParams,
  ): Promise<SqlConnection>;
}
