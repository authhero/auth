import { Totals } from "../../types";
import { Connection, ConnectionInsert } from "../../types/Connection";
import { ListParams } from "./ListParams";

export interface ListConnectionsResponse extends Totals {
  connections: Connection[];
}

export interface ConnectionsAdapter {
  create(tenant_id: string, params: ConnectionInsert): Promise<Connection>;
  remove(tenant_id: string, connection_id: string): Promise<boolean>;
  get(tenant_id: string, connection_id: string): Promise<Connection | null>;
  update(
    tenant_id: string,
    connection_id: string,
    params: Partial<ConnectionInsert>,
  ): Promise<boolean>;
  list(tenant_id: string, params: ListParams): Promise<ListConnectionsResponse>;
}
