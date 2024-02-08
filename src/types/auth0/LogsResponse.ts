export enum LogTypes {
  SUCCESS_API_OPERATION = "sapi",
  //
  SUCCESS_SILENT_AUTH = "ssa",
  FAILED_SILENT_AUTH = "fsa",
  //
  SUCCESS_SIGNUP = "ss",
  FAILED_SIGNUP = "fs",
  //
  SUCCESS_LOGIN = "s",
  FAILED_LOGIN_INCORRECT_PASSWORD = "fp",
  FAILED_LOGIN_INVALID_EMAIL_USERNAME = "fu",
  //
  SUCCESS_LOGOUT = "slo",
  //
  SUCCESS_CROSS_ORIGIN_AUTHENTICATION = "scoa",
  FAILED_CROSS_ORIGIN_AUTHENTICATION = "fcoa",
}
type LogType = `${LogTypes}`;

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
    // new fields so TS builds. adding nullable
    allowed_logout_url?: string[];
    session_id?: string;
    return_to?: string;
    prompts: any[];
  };
  // nullable in DB but we're always setting it
  user_agent?: string;
  // new fields so typescript builds - some will be required across all types... others not so much
  connection_id?: string;
  hostname?: string;
  audience?: string;
  scope?: string[];
  auth0_client?: {
    name: string;
    version: string;
    env?: object;
  };
  isMobile?: boolean;
  strategy?: string;
  strategy_type?: string;
  connection?: string;
  _id: string;
}

const logs: LogsResponse[] = [];
