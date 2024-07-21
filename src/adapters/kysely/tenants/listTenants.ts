import { Kysely } from "kysely";
import getCountAsInt from "../../../utils/getCountAsInt";
import { removeNullProperties } from "../helpers/remove-nulls";
import { Database } from "../db";
import { ListParams } from "@authhero/adapter-interfaces";

export function listTenants(db: Kysely<Database>) {
  return async (params: ListParams) => {
    let query = db.selectFrom("tenants");

    if (params.sort && params.sort.sort_by) {
      const { ref } = db.dynamic;
      query = query.orderBy(ref(params.sort.sort_by), params.sort.sort_order);
    }

    if (params.q) {
      query = query.where((eb) => eb.or([eb("name", "like", `%${params.q}%`)]));
    }

    const filteredQuery = query
      .offset(params.page * params.per_page)
      .limit(params.per_page);

    const tenants = await filteredQuery.selectAll().execute();

    if (!params.include_totals) {
      return {
        tenants,
      };
    }

    const [{ count }] = await query
      .select((eb) => eb.fn.countAll().as("count"))
      .execute();

    const countInt = getCountAsInt(count);

    return {
      tenants: tenants.map(removeNullProperties),
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: countInt,
    };
  };
}
