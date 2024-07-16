import { Database } from "../../../types";
import { Kysely } from "kysely";
import { removeNullProperties } from "../helpers/remove-nulls";
import { ListParams } from "../../interfaces/ListParams";
import { luceneFilter } from "../helpers/filter";
import getCountAsInt from "../../../utils/getCountAsInt";
import { ListHooksResponse } from "../../interfaces/Hooks";

export function list(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    params: ListParams,
  ): Promise<ListHooksResponse> => {
    let query = db.selectFrom("hooks").where("hooks.tenant_id", "=", tenant_id);

    if (params.q) {
      query = luceneFilter(db, query, params.q, ["url"]);
    }

    const filteredQuery = query
      .offset(params.page * params.per_page)
      .limit(params.per_page);

    const results = await filteredQuery.selectAll().execute();

    const [{ count }] = await query
      .select((eb) => eb.fn.countAll().as("count"))
      .execute();

    const countInt = getCountAsInt(count);
    const hooks = results.map((hook) => {
      const { tenant_id, enabled, ...rest } = hook;

      return removeNullProperties({
        ...rest,
        enabled: !!enabled,
      });
    });

    return {
      hooks,
      start: params.page * params.per_page,
      limit: params.per_page,
      length: countInt,
    };
  };
}
