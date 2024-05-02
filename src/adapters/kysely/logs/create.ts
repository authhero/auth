import { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { Database, SqlLog, Log } from "../../../types";

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

function getAuth0ClientValue(log: Log): string | undefined {
  // seems very arbitrary... but it's what auth0 does
  // const AUTH0_CLIENT_LOG_TYPES = ["seccft", "scoa", "fcoa", "fsa", "ssa"];
  if (
    // typescript cannot handle this syntax
    // AUTH0_CLIENT_LOG_TYPES.includes(log.type) &&
    log.type === "seccft" ||
    log.type === "scoa" ||
    log.type === "fcoa" ||
    log.type === "fsa" ||
    log.type === "ssa"
  ) {
    return stringifyIfTruthy(log.auth0_client);
  }

  return undefined;
}

function getScopeValue(log: Log): string | undefined {
  if (log.type === "fsa") {
    return log.scope.join(",");
  }

  if (log.type === "seccft") {
    return flattenScopesIfArray(log.scope);
  }

  return undefined;
}

export function createLog(db: Kysely<Database>) {
  return async (tenant_id: string, params: Log): Promise<SqlLog> => {
    const { details } = params;

    const log: SqlLog = {
      id: nanoid(),
      tenant_id,
      ...params,
      auth0_client: stringifyIfTruthy(getAuth0ClientValue(params)),
      details: stringifyIfTruthy(details),
      scope: getScopeValue(params),
      isMobile: params.isMobile ? 1 : 0,
    };
    await db.insertInto("logs").values(log).execute();
    return log;
  };
}
