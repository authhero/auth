import { nanoid } from "nanoid";
import { Log } from "../../../types";
import { CreateLogParams } from "../../interfaces/Logs";

export function createLog(logs: Log[]) {
  return async (log: CreateLogParams): Promise<Log> => {
    const { details } = log;

    const createdLog: Log = {
      id: nanoid(),
      ...log,
      details: details ? JSON.stringify(details) : undefined,
    };

    logs.push(createdLog);

    return createdLog;
  };
}
