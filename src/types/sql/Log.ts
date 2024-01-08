import { LogsResponse } from "../auth0";

export interface SqlLog extends Omit<LogsResponse, "log_id" | "details"> {
  id: string;
  tenant_id: string;
  details?: string;
}
