import { Database, LogsResponse, SqlLog } from "../../../types";
import { Kysely } from "kysely";
import { ListParams } from "../../interfaces/ListParams";
import getCountAsInt from "../../../utils/getCountAsInt";
import { luceneFilter } from "../helpers/filter";

function mapLog(log: SqlLog): LogsResponse {
  const { id, details, ...rest } = log;

  return {
    log_id: id,
    details: details ? JSON.parse(details) : undefined,
    ...rest,
  };
}

export function listLogs(db: Kysely<Database>) {
  return async (tenantId: string, params: ListParams) => {
    let query = db.selectFrom("logs").where("logs.tenant_id", "=", tenantId);

    if (params.q) {
      query = luceneFilter(db, query, params.q, ["user_id"]);
    }

    if (params.sort && params.sort.sort_by) {
      const { ref } = db.dynamic;
      query = query.orderBy(ref(params.sort.sort_by), params.sort.sort_order);
    }

    const filteredQuery = query
      .offset((params.page - 1) * params.per_page)
      .limit(params.per_page);

    const logs = await filteredQuery.selectAll().execute();

    const [{ count }] = await query
      .select((eb) => eb.fn.countAll().as("count"))
      .execute();

    const countInt = getCountAsInt(count);

    return {
      logs: logs.map(mapLog),
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: countInt,
    };
  };
}
