import { Kysely } from "kysely";
import { luceneFilter } from "../helpers/filter";
import getCountAsInt from "../../../utils/getCountAsInt";
import { Database } from "../db";
import { ListParams } from "@authhero/adapter-interfaces";

export function list(db: Kysely<Database>) {
  return async (tenantId: string, params: ListParams) => {
    let query = db
      .selectFrom("domains")
      .where("domains.tenant_id", "=", tenantId);

    if (params.q) {
      query = luceneFilter(db, query, params.q, ["user_id", "ip"]);
    }

    const filteredQuery = query
      .offset(params.page * params.per_page)
      .limit(params.per_page);

    const domains = await filteredQuery.selectAll().execute();

    const [{ count }] = await query
      .select((eb) => eb.fn.countAll().as("count"))
      .execute();

    const countInt = getCountAsInt(count);

    return {
      domains,
      start: params.page * params.per_page,
      limit: params.per_page,
      length: countInt,
    };
  };
}
