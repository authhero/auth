import { Totals } from "../../types";
import { Connection, ConnectionInsert } from "../../types/Connection";
import { ListParams } from "./ListParams";

export interface ListConnectionsResponse extends Totals {
  connections: Connection[];
}

export interface ConnectionsAdapter {
  create(tenant_id: string, params: ConnectionInsert): Promise<Connection>;
  list(tenant_id: string, params: ListParams): Promise<ListConnectionsResponse>;
}
