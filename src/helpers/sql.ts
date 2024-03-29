import { SelectQueryBuilder } from "kysely";
import { parseRange } from "./content-range";
import { Database } from "../types";

export async function executeQuery<T extends keyof Database>(
  query: SelectQueryBuilder<Database, T, {}>,
  rangeRequest?: string,
) {
  const parsedRange = parseRange(rangeRequest);

  const data = await query
    .selectAll()
    .offset(parsedRange.from)
    .limit(parsedRange.limit)
    .execute();

  if (!parsedRange.entity) {
    return { data };
  }

  const [{ count }] = await query
    .select((eb) => eb.fn.countAll().as("count"))
    .execute();

  const range = `${parsedRange.entity}=${parsedRange.from}-${parsedRange.to}/${count}`;

  return {
    data,
    range,
  };
}
