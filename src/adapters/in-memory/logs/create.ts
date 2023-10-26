import { nanoid } from "nanoid";
import { LogMessage } from "../../../types";
import { CreateLogMessageParams } from "../../interfaces/Logs";

export function createLog(logs: LogMessage[]) {
  return async (log: CreateLogMessageParams): Promise<LogMessage> => {
    const createdLog: LogMessage = {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      ...log,
    };

    logs.push(createdLog);

    return createdLog;
  };
}
