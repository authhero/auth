import { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { Database, SqlLog, Log } from "../../../types";

function stringifyIfTruthy<T>(value: T | undefined): string | undefined {
  return value ? JSON.stringify(value) : undefined;
}

const USER_AGENT_MAX_LENGTH = 1024;

export function createLog(db: Kysely<Database>) {
  return async (tenant_id: string, params: Log): Promise<SqlLog> => {
    const { details } = params;

    const log: SqlLog = {
      id: nanoid(),
      tenant_id,
      ...params,
      auth0_client: stringifyIfTruthy(params.auth0_client),
      details: stringifyIfTruthy(details)?.substring(0, 8192),
      scope: params.scope?.join(","),
      isMobile: params.isMobile ? 1 : 0,
      user_agent: params.user_agent.slice(0, USER_AGENT_MAX_LENGTH),
    };
    await db.insertInto("logs").values(log).execute();
    return log;
  };
}
