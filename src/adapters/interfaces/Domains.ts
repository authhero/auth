import { SqlDomain } from "../../types";

export type CreateDomainParams = SqlDomain;

export interface DomainsAdapter {
  create(tenant_id: string, params: CreateDomainParams): Promise<SqlDomain>;
}
