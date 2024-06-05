import { SqlLog, LogsResponse } from "../types";

export function getLogResponse(log: SqlLog): LogsResponse {
  const logResponse: LogsResponse = {
    ...log,
    client_id: log.client_id,
    client_name: "",
    auth0_client: log.auth0_client ? JSON.parse(log.auth0_client) : undefined,
    details: log.details ? JSON.parse(log.details) : undefined,
    isMobile: !!log.isMobile,
    scope: log.scope ? log.scope.split(",") : undefined,
    log_id: log.id,
    _id: log.id,
  };
  return logResponse;
}
