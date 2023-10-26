import { ListLogsResponse } from "../../interfaces/Logs";
import { ListParams } from "../../interfaces/ListParams";
import { LogMessage } from "../../../types";

export function listLogs(logs: LogMessage[]) {
  return async (
    tenantId,
    userId,
    { page, per_page, include_totals, q }: ListParams,
  ): Promise<ListLogsResponse> => {
    return {
      logs,
    };
  };
}
