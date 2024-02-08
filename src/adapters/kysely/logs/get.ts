import {
  Database,
  LogsResponse,
  LogType,
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
  LogsResponseBase,
  SqlLog,
} from "../../../types";
import { Kysely } from "kysely";

function getLogResponseBase(log: SqlLog): LogsResponseBase {
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

    default:
      throw new Error("Invalid log type");
  }
}

export function getLog(db: Kysely<Database>) {
  return async (
    tenantId: string,
    logId: string,
  ): Promise<LogsResponse | null> => {
    const log = await db
      .selectFrom("logs")
      .where("logs.tenant_id", "=", tenantId)
      .where("logs.id", "=", logId)
      .selectAll()
      .executeTakeFirst();

    if (!log) {
      return null;
    }

    // const logResponse: LogsResponse = {
    //   ...log,
    //   details: log.details ? JSON.parse(log.details) : undefined,
    //   log_id: log.id,
    // };

    const logResponseBase = getLogResponseBase(log);

    const logResponse: LogsResponse = {
      ...logResponseBase,
      log_id: logResponseBase.id,
      _id: logResponseBase.id,
    };

    return logResponse;
  };
}
