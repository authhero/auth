import { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { Database, Log } from "../../../types";
import { CreateLogParams } from "../../interfaces/Logs";

export function createLog(db: Kysely<Database>) {
  return async (params: CreateLogParams): Promise<Log> => {
    const { details } = params;

    const log: Log = {
      id: nanoid(),
      ...params,
      details: details ? JSON.stringify(details) : undefined,
    };

    await db.insertInto("logs").values(log).execute();

    return log;
  };
}
