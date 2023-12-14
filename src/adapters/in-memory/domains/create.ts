import { CreateDomainParams } from "../../interfaces/Domains";
import { SqlDomain } from "../../../types";

export function create(domains: SqlDomain[]) {
  return async (tenant_id: string, params: CreateDomainParams) => {
    const domain: SqlDomain = {
      ...params,
      tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    domains.push(domain);

    return domain;
  };
}
