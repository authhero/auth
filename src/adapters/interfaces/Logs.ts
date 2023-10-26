import { Totals } from "../../types/auth0/Totals";
import { Log } from "../../types/";
import { ListParams } from "./ListParams";

// TODO - remove this Message suffix...
export interface CreateLogParams {
  category: string;
  message: string;
  tenant_id: string;
  user_id: string;
} // this is the same as Omit<Log, "timestamp" | "id"> - any reason to define it?

export interface ListLogsResponse {
  logs: Log[];
  totals?: Totals;
}

export interface LogsDataAdapter {
  create(params: CreateLogParams): Promise<Log>;
  list(tenantId, userId, params: ListParams): Promise<ListLogsResponse>;
}
