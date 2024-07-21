import { Database } from "../../../types";
import { Kysely } from "kysely";
import { ListParams } from "../../../adapters/interfaces/ListParams";
import { luceneFilter } from "../helpers/filter";
import getCountAsInt from "../../../utils/getCountAsInt";
import { removeNullProperties } from "../helpers/remove-nulls";
import { ListConnectionsResponse } from "@authhero/adapter-interfaces";

export function list(db: Kysely<Database>) {
  return async (
    tenantId: string,
    params: ListParams,
  ): Promise<ListConnectionsResponse> => {
    let query = db
      .selectFrom("connections")
      .where("connections.tenant_id", "=", tenantId);

    if (params.q) {
      query = luceneFilter(db, query, params.q, ["user_id", "ip"]);
    }

    const filteredQuery = query
      .offset(params.page * params.per_page)
      .limit(params.per_page);

    const connections = await filteredQuery.selectAll().execute();

    const [{ count }] = await query
      .select((eb) => eb.fn.countAll().as("count"))
      .execute();

    const countInt = getCountAsInt(count);

    return {
      connections: connections.map(removeNullProperties),
      start: params.page * params.per_page,
      limit: params.per_page,
      length: countInt,
    };
  };
}
