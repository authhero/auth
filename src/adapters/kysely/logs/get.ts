import { Database, LogsResponse } from "../../../types";
import { Kysely } from "kysely";
import { getLogResponse } from "./logs";

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

    const logResponse = getLogResponse(log);

    return logResponse;
  };
}
