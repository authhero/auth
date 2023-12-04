import { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { Database, Log } from "../../../types";
import { CreateLogParams } from "../../interfaces/Logs";

export function createLog(db: Kysely<Database>) {
  return async (params: CreateLogParams): Promise<Log> => {
    const log: Log = {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      ...params,
    };

    await db.insertInto("logs").values(log).execute();

    return log;
  };
}
