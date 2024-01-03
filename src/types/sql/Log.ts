import { LogsResponse } from "../auth0";

export interface Log extends Omit<LogsResponse, "log_id" | "details"> {
  id: string;
  details?: string;
}
