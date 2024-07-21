import { Kysely } from "kysely";
import { LogsResponse } from "@authhero/adapter-interfaces";
import { getLogResponse } from "./logs";
import { Database } from "../db";

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
