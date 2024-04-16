import { Domain } from "../../types/Domain";
import { Totals } from "../../types";
import { ListParams } from "./ListParams";

export interface ListDomainsResponse extends Totals {
  domains: Domain[];
}

export interface DomainsAdapter {
  create(tenant_id: string, params: Domain): Promise<Domain>;
  list(tenant_id: string, params: ListParams): Promise<ListDomainsResponse>;
}
