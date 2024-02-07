interface GetLogsResponseDetails {
  [key: string]: any;
}

export interface LogsResponse {
  date?: string;
  type?: string;
  description?: string;
  client_id?: string;
  client_name?: string;
  ip?: string;
  user_id?: string;
  user_name?: string;
  log_id: string;
  details?: GetLogsResponseDetails;
  user_agent?: string;
}
