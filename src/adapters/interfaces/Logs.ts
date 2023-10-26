import { Totals } from "../../types/auth0/Totals";
import { LogMessage } from "../../types/";
import { ListParams } from "./ListParams";

// TODO - remove this Message suffix...
export interface CreateLogMessageParams {
  category: string;
  message: string;
  tenant_id: string;
  user_id: string;
}

export interface ListLogsResponse {
  logs: LogMessage[];
  totals?: Totals;
}

export interface LogsDataAdapter {
  create(params: CreateLogMessageParams): Promise<LogMessage>;
  list(tenantId, userId, params: ListParams): Promise<ListLogsResponse>;
}
