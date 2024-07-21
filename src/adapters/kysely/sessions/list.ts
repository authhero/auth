import {
  ListParams,
  ListSesssionsResponse,
} from "@authhero/adapter-interfaces";
import { Kysely } from "kysely";
import { luceneFilter } from "../helpers/filter";
import getCountAsInt from "../../../utils/getCountAsInt";
import { Database } from "../db";

export function list(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    params: ListParams,
  ): Promise<ListSesssionsResponse> => {
    let query = db
      .selectFrom("sessions")
      .where("sessions.tenant_id", "=", tenant_id);

    if (params.q) {
      query = luceneFilter(db, query, params.q, ["user_id", "id"]);
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

    const sessions = await filteredQuery.selectAll().execute();

    const [{ count }] = await query
      .select((eb) => eb.fn.countAll().as("count"))
      .execute();

    const countInt = getCountAsInt(count);

    return {
      sessions: sessions.map((session) => {
        const { id, ...rest } = session;
        return { session_id: id, ...rest };
      }),
      start: params.page * params.per_page,
      limit: params.per_page,
      length: countInt,
    };
  };
}
