import { SqlDomain } from "../../types";

// DomainsAdapter

export type CreateDomainParams = SqlDomain;

export interface DomainsAdapter {
  create(tenant_id: string, params: CreateDomainParams): Promise<SqlDomain>;
  // TODO
  // what other methods are needed to load this into default settings?
}
