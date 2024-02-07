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
  details?: {
    request: {
      method: string;
      path: string;
      headers: Record<string, string>;
      qs: Record<string, string[]>;
      body: Record<string, string>;
    };
  };
  // nullable in DB but we're always setting it
  user_agent?: string;
}
