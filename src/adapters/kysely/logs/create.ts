import { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { Database, SqlLog, LogsResponseBaseBase } from "../../../types";

function stringifyIfTruthy<T>(value: T | undefined): string | undefined {
  return value ? JSON.stringify(value) : undefined;
}

function flattenScopesIfArray(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value.join(",");
  }

  return value;
}

function getScopeValue(log: LogsResponseBaseBase): string | undefined {
  if (log.type === "fsa") {
    return log.scope.join(",");
  }

  if (log.type === "seccft") {
    return flattenScopesIfArray(log.scope);
  }

  return undefined;
}

export function createLog(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    params: LogsResponseBaseBase,
  ): Promise<SqlLog> => {
    const { details } = params;

    const sqlLog: SqlLog = {
      id: nanoid(),
      tenant_id,
      ...params,
      auth0_client: stringifyIfTruthy(params.auth0_client),
      details: stringifyIfTruthy(details),
      scope: getScopeValue(params),
    };
    await db.insertInto("logs").values(sqlLog).execute();
    return sqlLog;
  };
}
