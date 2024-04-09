export function parseSort(sort?: string):
  | undefined
  | {
      sort_by: string;
      sort_order: "asc" | "desc";
    } {
  if (!sort) {
    return undefined;
  }

  if (sort.startsWith("-")) {
    return {
      sort_by: sort.slice(1),
      sort_order: "desc",
    };
  }
  return {
    sort_by: sort,
    sort_order: "asc",
  };
}
