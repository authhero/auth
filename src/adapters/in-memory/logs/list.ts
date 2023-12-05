import { ListLogsResponse } from "../../interfaces/Logs";
import { ListParams } from "../../interfaces/ListParams";
import { Log } from "../../../types";

export function listLogs(logs: Log[]) {
  return async (
    tenantId: string,
    { page, per_page, include_totals, q }: ListParams,
  ): Promise<ListLogsResponse> => {
    return {
      logs,
      // no pagination just return all
      start: 0,
      length: logs.length,
      limit: logs.length,
    };
  };
}
