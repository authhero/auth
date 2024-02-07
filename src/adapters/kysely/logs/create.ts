import { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { Database, SqlLog } from "../../../types";
import { CreateLogParams } from "../../interfaces/Logs";

export function createLog(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    params: CreateLogParams,
  ): Promise<SqlLog> => {
    const { details } = params;

    const log: SqlLog = {
      id: nanoid(),
      tenant_id,
      ...params,
      details: details ? JSON.stringify(details) : undefined,
    };

    await db.insertInto("logs").values(log).execute();

    return log;
  };
}
