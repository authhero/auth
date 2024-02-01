import { Database, LogsResponse } from "../../../types";
import { Kysely } from "kysely";

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

    const logResponse: LogsResponse = {
      ...log,
      details: log.details ? JSON.parse(log.details) : undefined,
      log_id: log.id,
    };

    return logResponse;
  };
}
