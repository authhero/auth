import { Kysely } from "kysely";
import { ListParams } from "@authhero/adapter-interfaces";
import getCountAsInt from "../../../utils/getCountAsInt";
import { luceneFilter } from "../helpers/filter";
import { getLogResponse } from "./logs";
import { Database } from "../db";

export function listLogs(db: Kysely<Database>) {
  return async (tenant_id: string, params: ListParams) => {
    let query = db.selectFrom("logs").where("logs.tenant_id", "=", tenant_id);

    if (params.q) {
      query = luceneFilter(db, query, params.q, ["user_id", "ip"]);
    }

    let filteredQuery = query;

    if (params.sort && params.sort.sort_by) {
      const { ref } = db.dynamic;
      filteredQuery = filteredQuery.orderBy(
        ref(params.sort.sort_by),
        params.sort.sort_order,
      );
    }

    filteredQuery = filteredQuery
      .offset(params.page * params.per_page)
      .limit(params.per_page);

    const logs = await filteredQuery.selectAll().execute();

    const [{ count }] = await query
      .select((eb) => eb.fn.countAll().as("count"))
      .execute();

    const countInt = getCountAsInt(count);

    return {
      logs: logs.map(getLogResponse),
      start: params.page * params.per_page,
      limit: params.per_page,
      length: countInt,
    };
  };
}
