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
  FAILED_LOGIN = "f",
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

export type auth0Client = {
  name: string;
  version: string;
  env?: {
    node?: string;
  };
};

export interface LogCommonFields {
  type: LogType;
  date: string;
  description?: string;
  ip: string;
  user_agent: string;
  details?: any;
  isMobile: boolean;
}

interface BrowserLogCommonFields extends LogCommonFields {
  user_id: string;
  user_name: string;
  // do not have this field yet in SQL
  connection?: string;
  connection_id: string;
  client_id?: string;
  client_name: string;
}

export interface SuccessfulExchangeOfAccessTokenForAClientCredentialsGrant
  extends BrowserLogCommonFields {
  type: "seccft";
  audience?: string;
  // notice how this can be both in auth0! interesting
  scope?: string[] | string;
  strategy?: string;
  strategy_type?: string;
  hostname: string;
  auth0_client: auth0Client;
}

export interface SuccessCrossOriginAuthentication
  extends BrowserLogCommonFields {
  type: "scoa";
  hostname: string;
  auth0_client: auth0Client;
}
// interesting this doesn't extend the browser one... auth0 seems a bit random with what fields it provides
export interface FailedCrossOriginAuthentication extends LogCommonFields {
  type: "fcoa";
  hostname: string;
  connection_id: string;
  auth0_client: auth0Client;
}

export interface SuccessApiOperation extends LogCommonFields {
  type: "sapi";
  client_id?: string;
  client_name: string;
}

// TODO - reverse engineer this - do not have actual Auth0 example...
export interface FailedLogin extends LogCommonFields {
  type: "f";
}

export interface FailedLoginIncorrectPassword extends BrowserLogCommonFields {
  type: "fp";
  strategy: string;
  strategy_type: string;
}

export interface CodeLinkSent extends BrowserLogCommonFields {
  type: "cls";
  strategy: string;
  strategy_type: string;
}

export interface FailedSilentAuth extends LogCommonFields {
  type: "fsa";
  hostname: string;
  audience: string;
  scope: string[];
  client_id?: string;
  client_name: string;
  auth0_client: auth0Client;
}

export interface SuccessLogout extends BrowserLogCommonFields {
  type: "slo";
  hostname: string;
}

export interface SuccessLogin extends BrowserLogCommonFields {
  type: "s";
  strategy: string;
  strategy_type: string;
  hostname: string;
}

export interface SuccessSilentAuth extends LogCommonFields {
  type: "ssa";
  hostname: string;
  client_id?: string;
  client_name: string;
  session_connection: string;
  user_id: string;
  user_name: string;
  auth0_client: auth0Client;
}

export interface SuccessSignup extends BrowserLogCommonFields {
  type: "ss";
  hostname: string;
  strategy: string;
  strategy_type: string;
}

export type Log =
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
  | SuccessSignup
  | FailedLogin;

export type LogsResponse = Log & {
  log_id: string;
  _id: string;
};
