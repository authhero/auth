import { Totals } from "../../types/auth0/Totals";
import { Log } from "../../types/";
import { ListParams } from "./ListParams";

export interface CreateLogParams {
  category: string;
  message: string;
  tenant_id: string;
  user_id: string;
}

export interface ListLogsResponse extends Totals {
  logs: Log[];
}

export interface LogsDataAdapter {
  create(params: CreateLogParams): Promise<Log>;
  list(tenantId: string, params: ListParams): Promise<ListLogsResponse>;
}
