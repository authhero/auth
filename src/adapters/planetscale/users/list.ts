import { ListUsersResponse } from "../../interfaces/Users";
import { Database } from "../../../types";
import { Kysely, SelectQueryBuilder } from "kysely";
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

// This could probably be made generic
function luceneFilter(
  qb: SelectQueryBuilder<Database, "users", {}>,
  query: string,
) {
  const filters = query.split(/\s+/).map((filter) => {
    let isNegation = filter.startsWith("-");
    let key, value, isExistsQuery;

    if (filter.startsWith("-_exists_:")) {
      key = filter.substring(10); // Remove '-_exists_:' part
      isExistsQuery = true;
      isNegation = true;
    } else if (filter.startsWith("_exists_:")) {
      key = filter.substring(9); // Remove '_exists_:' part
      isExistsQuery = true;
      isNegation = false;
    } else {
      isNegation = filter.startsWith("-");
      [key, value] = isNegation
        ? filter.substring(1).split(":")
        : filter.split(":");
      isExistsQuery = false;
    }

    return { key, value, isNegation, isExistsQuery };
  });

  // Apply filters to the query builder
  filters.forEach(({ key, value, isNegation, isExistsQuery }) => {
    if (isExistsQuery) {
      if (isNegation) {
        qb = qb.where(key, "is", null);
      } else {
        qb = qb.where(key, "is not", null);
      }
    } else {
      if (isNegation) {
        qb = qb.where(key, "!=", value);
      } else {
        qb = qb.where(key, "=", value);
      }
    }
  });

  return qb;
}

export function listUsers(db: Kysely<Database>) {
  return async (tenantId, params: ListParams): Promise<ListUsersResponse> => {
    let query = db.selectFrom("users").where("users.tenant_id", "=", tenantId);
    if (params.q) {
      query = luceneFilter(query, params.q);
    }

    if (params.sort && params.sort.sort_by) {
      const { ref } = db.dynamic;
      query = query.orderBy(ref(params.sort.sort_by), params.sort.sort_order);
    }

    const filteredQuery = query
      .offset(params.page * params.per_page)
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
