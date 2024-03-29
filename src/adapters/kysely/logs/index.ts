import { Kysely } from "kysely";
import { Database } from "../../../types";
import { LogsDataAdapter } from "../../interfaces/Logs";
import { createLog } from "./create";
import { listLogs } from "./list";
import { getLogs } from "./get";

export function createLogsAdapter(db: Kysely<Database>): LogsDataAdapter {
  return {
    create: createLog(db),
    list: listLogs(db),
    get: getLogs(db),
  };
}
