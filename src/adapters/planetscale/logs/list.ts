import { Database } from "../../../types";
import { Kysely } from "kysely";
import { ListParams } from "../../../adapters/interfaces/ListParams";

export function listLogs(db: Kysely<Database>) {
  return async (tenantId, params: ListParams) => {
    if (!params.q) {
      throw new Error("No user_id provided");
    }

    const userId = params.q.split("user_id:")[1];

    console.log("userId ", userId);

    if (!userId) {
      throw new Error("No user_id provided");
    }

    let query = db
      .selectFrom("logs")
      .where("logs.tenant_id", "=", tenantId)
      .where("logs.user_id", "=", userId);

    // user_id

    console.log("params: ", params);

    // this kept blowing up for me but we could reinstate it...
    // if (params.q) {
    //   query = query.where((eb) =>
    //     eb.or([eb("logs.user_id", "like", `%${params.q}%`)]),
    //   );
    // }

    // if (params.sort && params.sort.sort_by) {
    //   const { ref } = db.dynamic;
    //   query = query.orderBy(ref(params.sort.sort_by), params.sort.sort_order);
    // }

    const filteredQuery = query;
    // .offset((params.page - 1) * params.per_page)
    // .limit(params.per_page);

    const logs = await filteredQuery.selectAll().execute();

    if (!params.include_totals) {
      return {
        logs,
      };
    }

    const [{ count }] = await query
      .select((eb) => eb.fn.countAll().as("count"))
      .execute();

    return {
      logs,
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: count,
    };
  };
}
