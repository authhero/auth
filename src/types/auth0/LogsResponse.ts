export enum LogTypes {
  SUCCESS_API_OPERATION = "sapi",
  //
  SUCCESS_SILENT_AUTH = "ssa",
  FAILED_SILENT_AUTH = "fsa",
  //
  SUCCESS_SIGNUP = "ss",
  // we don't have this in the logs yet
  // FAILED_SIGNUP = "fs",
  //
  SUCCESS_LOGIN = "s",
  FAILED_LOGIN_INCORRECT_PASSWORD = "fp",
  // we don't have this in the logs yet
  // FAILED_LOGIN_INVALID_EMAIL_USERNAME = "fu",
  //
  SUCCESS_LOGOUT = "slo",
  //
  SUCCESS_CROSS_ORIGIN_AUTHENTICATION = "scoa",
  FAILED_CROSS_ORIGIN_AUTHENTICATION = "fcoa",
  // TODO - not implemented - just for completion as we do get this in our latest auth0 logs
  NOT_IMPLEMENTED_1 = "seccft",
  NOT_IMPLEMENTED_2 = "cls",
}
export type LogType = `${LogTypes}`;

export interface LogsResponseBase {
  type: LogType;
  date: string;
  description?: string;
  ip: string;
  user_agent: string;
  details?: any;
  auth0_client?: {
    name: string;
    version: string;
    env?: object;
  };
  isMobile?: boolean;
}

// i'm thinking there might be another base type... for when from the browser vs mgmt api!
interface BrowserLogsResponseBase extends LogsResponseBase {
  user_id: string;
  user_name: string;
  // do not have this field yet in SQL
  connection?: string;
  connection_id: string;
  client_id: string;
  client_name: string;
}

export interface SuccessfulExchangeOfAccessTokenForAClientCredentialsGrant
  extends BrowserLogsResponseBase {
  type: "seccft";
  audience?: string;
  // notice how this can be both in auth0! interesting
  scope?: string[] | string;
  strategy?: string;
  strategy_type?: string;
  hostname: string;
}

export interface SuccessCrossOriginAuthentication
  extends BrowserLogsResponseBase {
  type: "scoa";
  hostname: string;
}
// interesting this doesn't extend the browser one... auth0 seems a bit random with what fields it provides
export interface FailedCrossOriginAuthentication extends LogsResponseBase {
  type: "fcoa";
  hostname: string;
  connection_id: string;
}

export interface SuccessApiOperation extends LogsResponseBase {
  type: "sapi";
  client_id: string;
  client_name: string;
}

export interface FailedLoginIncorrectPassword extends BrowserLogsResponseBase {
  type: "fp";
  strategy: string;
  strategy_type: string;
}

export interface CodeLinkSent extends BrowserLogsResponseBase {
  type: "cls";
  strategy: string;
  strategy_type: string;
}

export interface FailedSilentAuth extends LogsResponseBase {
  type: "fsa";
  hostname: string;
  audience: string;
  scope: string[];
  client_id: string;
  client_name: string;
}

export interface SuccessLogout extends BrowserLogsResponseBase {
  type: "slo";
  hostname: string;
}

export interface SuccessLogin extends BrowserLogsResponseBase {
  type: "s";
  strategy: string;
  strategy_type: string;
  hostname: string;
}

export interface SuccessSilentAuth extends LogsResponseBase {
  type: "ssa";
  hostname: string;
  client_id: string;
  client_name: string;
  session_connection: string;
  user_id: string;
  user_name: string;
}

export interface SuccessSignup extends BrowserLogsResponseBase {
  type: "ss";
  hostname: string;
  strategy: string;
  strategy_type: string;
}

// lol the naming here... essentially want all fields except the id
export type LogsResponseBaseBase =
  | SuccessfulExchangeOfAccessTokenForAClientCredentialsGrant
  | SuccessCrossOriginAuthentication
  | SuccessApiOperation
  | FailedLoginIncorrectPassword
  | FailedCrossOriginAuthentication
  | CodeLinkSent
  | FailedSilentAuth
  | SuccessLogout
  | SuccessLogin
  | SuccessSilentAuth
  | SuccessSignup;

export type LogsResponse = LogsResponseBaseBase & {
  log_id: string;
  _id: string;
};
