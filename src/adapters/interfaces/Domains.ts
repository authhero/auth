import { SqlDomain } from "../../types";

export type CreateDomainParams = Omit<SqlDomain, "tenant_id">;

export interface DomainsAdapter {
  create(tenant_id: string, params: CreateDomainParams): Promise<SqlDomain>;
}
