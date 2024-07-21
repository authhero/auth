import { Kysely, SelectQueryBuilder } from "kysely";
import { Database } from "../db";

export function luceneFilter<TB extends keyof Database>(
  db: Kysely<Database>,
  qb: SelectQueryBuilder<Database, TB, {}>,
  query: string,
  searchableColumns: string[],
) {
  const filters = query
    .split(/\s+/)
    // TODO - no .replaceAll? is this our typing rather than reality? Is this hack safe?
    .map((q) => q.replace("=", ":"))
    .map((filter) => {
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
      } else if (filter.includes(":")) {
        isNegation = filter.startsWith("-");
        [key, value] = isNegation
          ? filter.substring(1).split(":")
          : filter.split(":");
        isExistsQuery = false;
      } else {
        // Single word search case
        key = null;
        value = filter;
        isExistsQuery = false;
      }

      return { key, value, isNegation, isExistsQuery };
    });

  // Apply filters to the query builder
  filters.forEach(({ key, value, isNegation, isExistsQuery }) => {
    if (key) {
      if (isExistsQuery) {
        if (isNegation) {
          // I'm not following how this ever worked...
          qb = qb.where(key as any, "is", null);
        } else {
          qb = qb.where(key as any, "is not", null);
        }
      } else {
        if (isNegation) {
          qb = qb.where(key as any, "!=", value);
        } else {
          qb = qb.where(key as any, "=", value);
        }
      }
    } else {
      const { ref } = db.dynamic;
      // Generic single-word search across specified columns
      qb = qb.where((eb) =>
        eb.or(
          searchableColumns.map((col) => eb(ref(col), "like", `%${value}%`)),
        ),
      );
    }
  });

  return qb;
}
