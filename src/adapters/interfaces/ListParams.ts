export interface ListParams {
  page: number;
  per_page: number;
  include_totals: boolean;
  sort?: {
    sort_by: string;
    sort_order: "asc" | "desc";
  };
}
