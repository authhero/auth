import { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { Database, LogMessage } from "../../../types";
import { CreateLogMessageParams } from "../../interfaces/Logs";

export function createLog(db: Kysely<Database>) {
  return async (params: CreateLogMessageParams): Promise<LogMessage> => {
    const log: LogMessage = {
      id: nanoid(),
      // what format do we want this?
      timestamp: new Date().toISOString(),
      ...params,
    };

    await db.insertInto("logs").values(log).execute();

    return log;
  };
}
