import {
  LogsResponseBaseBase,
  SuccessApiOperation,
  SuccessCrossOriginAuthentication,
  FailedLoginIncorrectPassword,
  FailedCrossOriginAuthentication,
  CodeLinkSent,
  SuccessLogout,
  FailedSilentAuth,
  SuccessLogin,
  SuccessSilentAuth,
  SqlLog,
  SuccessSignup,
} from "../types";

function getCommonFields(log: SqlLog) {
  return {
    ...log,
    client_id: log.client_id,
    client_name: "",
    auth0_client: log.auth0_client ? JSON.parse(log.auth0_client) : undefined,
    details: log.details ? JSON.parse(log.details) : undefined,
  };
}

export function getLogResponseBase(log: SqlLog): LogsResponseBaseBase {
  switch (log.type) {
    case "sapi": {
      const successApiOperation: SuccessApiOperation = {
        ...getCommonFields(log),
        type: "sapi",
      };
      return successApiOperation;
    }
    case "scoa": {
      const successCrossOriginAuthentication: SuccessCrossOriginAuthentication =
        {
          ...getCommonFields(log),
          type: "scoa",
          hostname: log.hostname || "",
          user_id: log.user_id || "",
          user_name: log.user_name || "",
          connection_id: log.connection_id || "",
          connection: log.connection || "",
        };
      return successCrossOriginAuthentication;
    }

    case "fcoa": {
      const failedCrossOriginAuthentication: FailedCrossOriginAuthentication = {
        ...getCommonFields(log),
        type: "fcoa",
        hostname: log.hostname || "",
        connection_id: log.connection_id || "",
      };
      return failedCrossOriginAuthentication;
    }

    case "fp": {
      const failedLoginIncorrectPassword: FailedLoginIncorrectPassword = {
        ...getCommonFields(log),
        type: "fp",
        strategy: log.strategy || "",
        strategy_type: log.strategy_type || "",
        user_id: log.user_id || "",
        user_name: log.user_name || "",
        connection: log.connection || "",
        connection_id: log.connection_id || "",
      };
      return failedLoginIncorrectPassword;
    }

    case "cls": {
      const codeLinkSent: CodeLinkSent = {
        ...getCommonFields(log),
        type: "cls",
        strategy: log.strategy || "",
        strategy_type: log.strategy_type || "",
        user_id: log.user_id || "",
        user_name: log.user_name || "",
        connection: log.connection || "",
        connection_id: log.connection_id || "",
      };
      return codeLinkSent;
    }

    case "fsa": {
      const failedSilentAuth: FailedSilentAuth = {
        ...getCommonFields(log),
        type: "fsa",
        hostname: log.hostname || "",
        audience: log.audience || "",
        scope: log.scope?.split(",") || [],
      };
      return failedSilentAuth;
    }

    case "slo": {
      const successLogout: SuccessLogout = {
        ...getCommonFields(log),
        type: "slo",
        hostname: log.hostname || "",
        user_id: log.user_id || "",
        user_name: log.user_name || "",
        connection: log.connection || "",
        connection_id: log.connection_id || "",
      };
      return successLogout;
    }

    case "s": {
      const successLogin: SuccessLogin = {
        ...getCommonFields(log),
        type: "s",
        user_id: log.user_id || "",
        user_name: log.user_name || "",
        connection: log.connection || "",
        connection_id: log.connection_id || "",
        strategy: log.strategy || "",
        strategy_type: log.strategy_type || "",
        hostname: log.hostname || "",
      };
      return successLogin;
    }

    case "ssa": {
      const successSilentAuth: SuccessSilentAuth = {
        ...getCommonFields(log),
        type: "ssa",
        hostname: log.hostname || "",
        // ooooo. this needs a new field
        session_connection: "",
        user_id: log.user_id || "",
        user_name: log.user_name || "",
      };
      return successSilentAuth;
    }

    case "ss": {
      const successSignup: SuccessSignup = {
        ...getCommonFields(log),
        type: "ss",
        hostname: log.hostname || "",
        user_id: log.user_id || "",
        user_name: log.user_name || "",
        strategy: log.strategy || "",
        strategy_type: log.strategy_type || "",
        connection: log.connection || "",
        connection_id: log.connection_id || "",
      };
      return successSignup;
    }

    default:
      throw new Error("Invalid log type");
  }
}
