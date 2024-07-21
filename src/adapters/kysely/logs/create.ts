import { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { Log } from "@authhero/adapter-interfaces";
import { SqlLog } from "../../../types";
import { Database } from "../db";

function stringifyIfTruthy<T>(value: T | undefined): string | undefined {
  return value ? JSON.stringify(value) : undefined;
}

const USER_AGENT_MAX_LENGTH = 1024;

export function createLog(db: Kysely<Database>) {
  return async (tenant_id: string, log: Log): Promise<Log> => {
    const createdLog = {
      id: nanoid(),
      ...log,
      user_agent: log.user_agent.slice(0, USER_AGENT_MAX_LENGTH),
    };
    await db
      .insertInto("logs")
      .values({
        ...createdLog,
        isMobile: log.isMobile ? 1 : 0,
        tenant_id,
        scope: log.scope?.join(","),
        auth0_client: stringifyIfTruthy(log.auth0_client),
        details: stringifyIfTruthy(log.details)?.substring(0, 8192),
      })
      .execute();

    return createdLog;
  };
}
