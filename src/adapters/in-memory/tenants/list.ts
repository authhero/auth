import { ListParams } from "../../../adapters/interfaces/ListParams";
import { Tenant } from "../../../types";

function sortByString<T>(
  arr: T[],
  sort?: {
    sort_by: string;
    sort_order: "asc" | "desc";
  },
): T[] {
  if (!sort) {
    return arr;
  }

  const order = sort.sort_order === "asc" ? 1 : -1;

  return arr.sort((a, b) => {
    if (a[sort.sort_by] < b[sort.sort_by]) {
      return -1 * order;
    } else if (a[sort.sort_by] > b[sort.sort_by]) {
      return 1 * order;
    }
    return 0;
  });
}

export function listTenants(tenants: Tenant[]) {
  return async (params: ListParams) => {
    const sortedTenants = sortByString(tenants as any[], params.sort);

    const pagedTenants = sortedTenants.slice(
      (params.page - 1) * params.per_page,
      params.page * params.per_page,
    );

    if (!params.include_totals) {
      return {
        tenants: pagedTenants,
      };
    }

    return {
      tenants: pagedTenants,
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: tenants.length,
    };
  };
}
