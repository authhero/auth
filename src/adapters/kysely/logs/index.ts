import { Kysely } from "kysely";
import { LogsDataAdapter } from "@authhero/adapter-interfaces";
import { createLog } from "./create";
import { listLogs } from "./list";
import { getLogs } from "./get";
import { Database } from "../db";

export function createLogsAdapter(db: Kysely<Database>): LogsDataAdapter {
  return {
    create: createLog(db),
    list: listLogs(db),
    get: getLogs(db),
  };
}
