import { Database, LogsResponse } from "../../../types";
import { Kysely } from "kysely";
import { getLogResponseBase } from "../../../utils/logs";

export function getLogs(db: Kysely<Database>) {
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

    const logResponseBaseBase = getLogResponseBase(log);

    const logResponse: LogsResponse = {
      ...logResponseBaseBase,
      log_id: log.id,
      _id: log.id,
    };

    return logResponse;
  };
}
