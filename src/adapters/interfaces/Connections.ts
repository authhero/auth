import { Connection, ConnectionInsert } from "../../types/Connection";
import { ListParams } from "./ListParams";

export interface ConnectionsAdapter {
  create(tenant_id: string, params: ConnectionInsert): Promise<Connection>;
  list(tenant_id: string, params: ListParams): Promise<Connection[]>;
}
