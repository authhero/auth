import { Database } from "../../../types";
import { Kysely } from "kysely";
import { ListParams } from "../../interfaces/ListParams";
import getCountAsInt from "../../../utils/getCountAsInt";

export function listLogs(db: Kysely<Database>) {
  return async (tenantId, params: ListParams) => {
    if (!params.q) {
      throw new Error("No user_id provided");
    }

    const userId = decodeURIComponent(params.q).split("user_id:")[1];

    if (!userId) {
      throw new Error("No user_id provided");
    }

    let query = db
      .selectFrom("logs")
      .where("logs.tenant_id", "=", tenantId)
      .where("logs.user_id", "=", userId);

    // TODO
    // if (params.sort && params.sort.sort_by) {
    //   const { ref } = db.dynamic;
    //   query = query.orderBy(ref(params.sort.sort_by), params.sort.sort_order);
    // }

    const filteredQuery = query
      .offset((params.page - 1) * params.per_page)
      .limit(params.per_page);

    const logs = await filteredQuery.selectAll().execute();

    const [{ count }] = await query
      .select((eb) => eb.fn.countAll().as("count"))
      .execute();

    const countInt = getCountAsInt(count);

    return {
      logs,
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: countInt,
    };
  };
}
