import { ListUsersResponse } from "../../interfaces/Users";
import { Database } from "../../../types";
import { Kysely } from "kysely";
import { ListParams } from "../../interfaces/ListParams";
import getCountAsInt from "../../../utils/getCountAsInt";
import { luceneFilter } from "../helpers/filter";

export function listUsers(db: Kysely<Database>) {
  return async (
    tenantId: string,
    params: ListParams,
  ): Promise<ListUsersResponse> => {
    let query = db.selectFrom("users").where("users.tenant_id", "=", tenantId);
    if (params.q) {
      // NOTE - this isn't faithful to Auth0 as Auth0 does this in the dashboard - we can filter by any field on the Auth0 mgmt api
      query = luceneFilter(db, query, params.q, ["email", "name"]);
    }

    if (params.sort && params.sort.sort_by) {
      const { ref } = db.dynamic;
      query = query.orderBy(ref(params.sort.sort_by), params.sort.sort_order);
    }

    const filteredQuery = query
      .offset(params.page * params.per_page)
      .limit(params.per_page);

    const users = await filteredQuery.selectAll().execute();

    const [{ count }] = await query
      .select((eb) => eb.fn.countAll().as("count"))
      .execute();

    const countInt = getCountAsInt(count);

    return {
      users: users.map((u) => ({
        ...u,
        email_verified: u.email_verified === 1,
        is_social: u.is_social === 1,
      })),
      start: params.page * params.per_page,
      limit: params.per_page,
      length: countInt,
    };
  };
}
