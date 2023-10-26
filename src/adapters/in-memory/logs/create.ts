import { nanoid } from "nanoid";
import { Log } from "../../../types";
import { CreateLogParams } from "../../interfaces/Logs";

export function createLog(logs: Log[]) {
  return async (log: CreateLogParams): Promise<Log> => {
    const createdLog: Log = {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      ...log,
    };

    logs.push(createdLog);

    return createdLog;
  };
}
