import { LogsDataAdapter } from "../../interfaces/Logs";
import { createLog } from "./create";
import { listLogs } from "./list";
import { Log } from "../../../types";

export function createLogsAdapter(): LogsDataAdapter {
  const users: Log[] = [];

  return {
    create: createLog(users),
    list: listLogs(users),
  };
}
