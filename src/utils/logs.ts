import { SqlLog, LogsResponse } from "../types";

function getCommonFields(log: SqlLog) {
  return {
    ...log,
    client_id: log.client_id,
    client_name: "",
    auth0_client: log.auth0_client ? JSON.parse(log.auth0_client) : undefined,
    details: log.details ? JSON.parse(log.details) : undefined,
    isMobile: !!log.isMobile,
  };
}

export function getLogResponse(log: SqlLog): LogsResponse {
  const logResponse: LogsResponse = {
    ...log,
    ...getCommonFields(log),
    //d do also need optional chaining to empty strings?
    log_id: log.id,
    _id: log.id,
  };
  return logResponse;
}
