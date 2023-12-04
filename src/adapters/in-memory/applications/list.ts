import { ListParams } from "../../interfaces/ListParams";
import { Application } from "../../../types";

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

export function list(applicationStorage: Application[]) {
  return async (tenant_id: string, params: ListParams) => {
    let applications = sortByString(applicationStorage as any[], params.sort);

    if (params.q) {
      applications = applications.filter((tenant) =>
        tenant.name.toLowerCase().includes(params.q?.toLowerCase()),
      );
    }

    applications = applications.slice(
      (params.page - 1) * params.per_page,
      params.page * params.per_page,
    );

    if (!params.include_totals) {
      return {
        applications,
      };
    }

    return {
      applications,
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: applications.length,
    };
  };
}
