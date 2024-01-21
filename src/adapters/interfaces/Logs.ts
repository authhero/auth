import { Totals } from "../../types/auth0/Totals";
import { LogsResponse, SqlLog } from "../../types/";
import { ListParams } from "./ListParams";

export interface CreateLogParams {
  category: string;
  type: string;
  description: string;
  tenant_id: string;
  user_id: string;
  client_id: string;
  client_name: string;
  date: string;
  user_agent?: string;
  ip: string;
  details?: {
    request: {
      method: string;
      path: string;
      headers: Record<string, string>;
      qs: Record<string, string[]>;
      body: Record<string, string>;
    };
  };
}

export interface ListLogsResponse extends Totals {
  logs: LogsResponse[];
}

export interface LogsDataAdapter {
  create(params: CreateLogParams): Promise<SqlLog>;
  list(tenantId: string, params: ListParams): Promise<ListLogsResponse>;
}
