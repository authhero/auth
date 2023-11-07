import { getDb } from "../../../services/db";
import { Env } from "../../../types";
import { LogsDataAdapter } from "../../interfaces/Logs";
import { createLog } from "./create";
import { listLogs } from "./list";

export function createLogsAdapter(env: Env): LogsDataAdapter {
  const db = getDb(env);

  return {
    create: createLog(db),
    list: listLogs(db),
  };
}
