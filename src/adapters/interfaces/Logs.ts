import { Totals } from "../../types/auth0/Totals";
import { LogsResponse, SqlLog, LogsResponseBaseBase } from "../../types/";
import { ListParams } from "./ListParams";

export interface ListLogsResponse extends Totals {
  logs: LogsResponse[];
}

export interface LogsDataAdapter {
  create(tenantId: string, params: LogsResponseBaseBase): Promise<SqlLog>;
  list(tenantId: string, params: ListParams): Promise<ListLogsResponse>;
  get(tenantId: string, logId: string): Promise<LogsResponse | null>;
}
