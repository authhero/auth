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

export function createLog(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    params: LogsResponseBaseBase,
  ): Promise<SqlLog> => {
    const { details } = params;

    switch (params.type) {
      case "sapi": {
        const log: SqlLog = {
          id: nanoid(),
          tenant_id,
          ...params,
          auth0_client: stringifyIfTruthy(params.auth0_client),
          details: stringifyIfTruthy(details),
        };
        await db.insertInto("logs").values(log).execute();
        return log;
      }
      case "scoa": {
        const log: SqlLog = {
          id: nanoid(),
          tenant_id,
          ...params,
          auth0_client: stringifyIfTruthy(params.auth0_client),
          details: stringifyIfTruthy(details),
        };
        await db.insertInto("logs").values(log).execute();
        return log;
      }
      case "fcoa": {
        const log: SqlLog = {
          id: nanoid(),
          tenant_id,
          ...params,
          auth0_client: stringifyIfTruthy(params.auth0_client),
          details: stringifyIfTruthy(details),
        };
        await db.insertInto("logs").values(log).execute();
        return log;
      }

      case "fp": {
        const log: SqlLog = {
          id: nanoid(),
          tenant_id,
          ...params,
          auth0_client: stringifyIfTruthy(params.auth0_client),
          details: stringifyIfTruthy(details),
        };
        await db.insertInto("logs").values(log).execute();
        return log;
      }

      case "cls": {
        const log: SqlLog = {
          id: nanoid(),
          tenant_id,
          ...params,
          auth0_client: stringifyIfTruthy(params.auth0_client),
          details: stringifyIfTruthy(details),
        };
        await db.insertInto("logs").values(log).execute();
        return log;
      }

      case "fsa": {
        const log: SqlLog = {
          id: nanoid(),
          tenant_id,
          ...params,
          auth0_client: stringifyIfTruthy(params.auth0_client),
          details: stringifyIfTruthy(details),
          scope: flattenScopesIfArray(params.scope),
        };
        await db.insertInto("logs").values(log).execute();
        return log;
      }

      case "slo": {
        const log: SqlLog = {
          id: nanoid(),
          tenant_id,
          ...params,
          auth0_client: stringifyIfTruthy(params.auth0_client),
          details: stringifyIfTruthy(details),
        };
        await db.insertInto("logs").values(log).execute();
        return log;
      }

      case "s": {
        const log: SqlLog = {
          id: nanoid(),
          tenant_id,
          ...params,
          auth0_client: stringifyIfTruthy(params.auth0_client),
          details: stringifyIfTruthy(details),
        };
        await db.insertInto("logs").values(log).execute();
        return log;
      }

      case "ssa": {
        const log: SqlLog = {
          id: nanoid(),
          tenant_id,
          ...params,
          auth0_client: stringifyIfTruthy(params.auth0_client),
          details: stringifyIfTruthy(details),
        };
        await db.insertInto("logs").values(log).execute();
        return log;
      }

      case "ss": {
        const log: SqlLog = {
          id: nanoid(),
          tenant_id,
          ...params,
          auth0_client: stringifyIfTruthy(params.auth0_client),
          details: stringifyIfTruthy(details),
        };
        await db.insertInto("logs").values(log).execute();
        return log;
      }

      // TODO - dedupe all these case statements!

      default:
        throw new Error("Invalid log type");
    }

    // need to conditionally check types of logs...
    // scope: flattenScopesIfArray(params.scope),
  };
}
