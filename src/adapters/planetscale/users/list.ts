import { ListUsersResponse } from "../../interfaces/Users";
import { Database } from "../../../types";
import { Kysely } from "kysely";
import { ListParams } from "../../interfaces/ListParams";

// duplicated from tenants
function getCountAsInt(count: string | number | bigint) {
  // VScode complains that parseInt only accepts a string BUT the project builds & lints
  if (typeof count === "string") {
    return parseInt(count, 10);
  }

  if (typeof count === "bigint") {
    return Number(count);
  }

  return count;
}

export function listUsers(db: Kysely<Database>) {
  return async (tenantId, params: ListParams): Promise<ListUsersResponse> => {
    let query = db.selectFrom("users").where("users.tenant_id", "=", tenantId);

    if (params.sort && params.sort.sort_by) {
      const { ref } = db.dynamic;
      query = query.orderBy(ref(params.sort.sort_by), params.sort.sort_order);
    }

    if (params.q) {
      query = query.where((eb) =>
        eb.or([eb("email", "like", `%${params.q}%`)]),
      );
    }

    const filteredQuery = query
      .offset((params.page - 1) * params.per_page)
      .limit(params.per_page);

    const users = await filteredQuery.selectAll().execute();

    // if (!params.include_totals) {
    //   return {
    //     users,
    //   };
    // }

    const [{ count }] = await query
      .select((eb) => eb.fn.countAll().as("count"))
      .execute();

    const countInt = getCountAsInt(count);

    return {
      users,
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: countInt,
    };
  };
}
