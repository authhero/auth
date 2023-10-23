export interface ListParams {
  page: number;
  per_page: number;
  include_totals: boolean;
  q?: string;
  sort?: {
    sort_by: string;
    sort_order: "asc" | "desc";
  };
}
