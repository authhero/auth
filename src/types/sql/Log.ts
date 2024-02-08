import { LogsResponse } from "../auth0";

// can no longer be like this! needs to be duplicated with everything optional...
export interface SqlLog extends Omit<LogsResponse, "log_id" | "details"> {
  id: string;
  tenant_id?: string;
  details?: string;
}
