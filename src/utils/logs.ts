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

export function getLogResponseBase(log: SqlLog): LogsResponseBaseBase {
  switch (log.type) {
    case "sapi": {
      const successApiOperation: SuccessApiOperation = {
        ...log,
        type: "sapi",
        client_id: log.client_id || "",
        client_name: "",
        auth0_client: log.auth0_client
          ? JSON.parse(log.auth0_client)
          : undefined,
        details: log.details ? JSON.parse(log.details) : undefined,
      };
      return successApiOperation;
    }
    case "scoa": {
      const successCrossOriginAuthentication: SuccessCrossOriginAuthentication =
        {
          ...log,
          type: "scoa",
          hostname: log.hostname || "",
          user_id: log.user_id || "",
          user_name: log.user_name || "",
          client_id: log.client_id || "",
          client_name: "",
          auth0_client: log.auth0_client
            ? JSON.parse(log.auth0_client)
            : undefined,
          connection_id: log.connection_id || "",
          connection: log.connection || "",
          details: log.details ? JSON.parse(log.details) : undefined,
        };
      return successCrossOriginAuthentication;
    }

    case "fcoa": {
      const failedCrossOriginAuthentication: FailedCrossOriginAuthentication = {
        ...log,
        type: "fcoa",
        hostname: log.hostname || "",
        auth0_client: log.auth0_client
          ? JSON.parse(log.auth0_client)
          : undefined,
        connection_id: log.connection_id || "",
        details: log.details ? JSON.parse(log.details) : undefined,
      };
      return failedCrossOriginAuthentication;
    }

    case "fp": {
      const failedLoginIncorrectPassword: FailedLoginIncorrectPassword = {
        ...log,
        type: "fp",
        client_id: log.client_id || "",
        client_name: "",
        auth0_client: log.auth0_client
          ? JSON.parse(log.auth0_client)
          : undefined,
        strategy: log.strategy || "",
        strategy_type: log.strategy_type || "",
        user_id: log.user_id || "",
        user_name: log.user_name || "",
        connection: log.connection || "",
        connection_id: log.connection_id || "",
        details: log.details ? JSON.parse(log.details) : undefined,
      };
      return failedLoginIncorrectPassword;
    }

    case "cls": {
      const codeLinkSent: CodeLinkSent = {
        ...log,
        type: "cls",
        client_id: log.client_id || "",
        client_name: "",
        auth0_client: log.auth0_client
          ? JSON.parse(log.auth0_client)
          : undefined,
        strategy: log.strategy || "",
        strategy_type: log.strategy_type || "",
        user_id: log.user_id || "",
        user_name: log.user_name || "",
        connection: log.connection || "",
        connection_id: log.connection_id || "",
        details: log.details ? JSON.parse(log.details) : undefined,
      };
      return codeLinkSent;
    }

    case "fsa": {
      const failedSilentAuth: FailedSilentAuth = {
        ...log,
        type: "fsa",
        client_id: log.client_id || "",
        client_name: "",
        auth0_client: log.auth0_client
          ? JSON.parse(log.auth0_client)
          : undefined,
        hostname: log.hostname || "",
        audience: log.audience || "",
        scope: log.scope?.split(",") || [],
        details: log.details ? JSON.parse(log.details) : undefined,
      };
      return failedSilentAuth;
    }

    case "slo": {
      const successLogout: SuccessLogout = {
        ...log,
        type: "slo",
        client_id: log.client_id || "",
        client_name: "",
        auth0_client: log.auth0_client
          ? JSON.parse(log.auth0_client)
          : undefined,
        hostname: log.hostname || "",
        user_id: log.user_id || "",
        user_name: log.user_name || "",
        connection: log.connection || "",
        connection_id: log.connection_id || "",
        details: log.details ? JSON.parse(log.details) : undefined,
      };
      return successLogout;
    }

    case "s": {
      const successLogin: SuccessLogin = {
        ...log,
        type: "s",
        client_id: log.client_id || "",
        client_name: "",
        auth0_client: log.auth0_client
          ? JSON.parse(log.auth0_client)
          : undefined,
        user_id: log.user_id || "",
        user_name: log.user_name || "",
        connection: log.connection || "",
        connection_id: log.connection_id || "",
        strategy: log.strategy || "",
        strategy_type: log.strategy_type || "",
        hostname: log.hostname || "",
        details: log.details ? JSON.parse(log.details) : undefined,
      };
      return successLogin;
    }

    case "ssa": {
      const successSilentAuth: SuccessSilentAuth = {
        ...log,
        type: "ssa",
        client_id: log.client_id || "",
        client_name: "",
        auth0_client: log.auth0_client
          ? JSON.parse(log.auth0_client)
          : undefined,
        hostname: log.hostname || "",
        // ooooo. this needs a new field
        session_connection: "",
        user_id: log.user_id || "",
        user_name: log.user_name || "",
        details: log.details ? JSON.parse(log.details) : undefined,
      };
      return successSilentAuth;
    }

    case "ss": {
      const successSignup: SuccessSignup = {
        ...log,
        type: "ss",
        client_id: log.client_id || "",
        client_name: "",
        auth0_client: log.auth0_client
          ? JSON.parse(log.auth0_client)
          : undefined,
        hostname: log.hostname || "",
        user_id: log.user_id || "",
        user_name: log.user_name || "",
        strategy: log.strategy || "",
        strategy_type: log.strategy_type || "",
        connection: log.connection || "",
        connection_id: log.connection_id || "",
        details: log.details ? JSON.parse(log.details) : undefined,
      };
      return successSignup;
    }

    default:
      throw new Error("Invalid log type");
  }
}
