import { Totals } from "../../types/auth0/Totals";
import { LogMessage } from "../../types/";
import { ListParams } from "./ListParams";

export interface CreateLogMessageParams {
  category: string;
  message: string;
  tenant_id: string;
  user_id: string;
}

export interface LogsDataAdapter {
  create(params: CreateLogMessageParams): Promise<LogMessage>;
  list(params: ListParams): Promise<{ tenants: LogMessage[]; totals?: Totals }>;
}
