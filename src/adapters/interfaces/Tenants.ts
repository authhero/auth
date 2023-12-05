import { Tenant } from "../../types";
import { Totals } from "../../types/auth0/Totals";
import { ListParams } from "./ListParams";

export interface CreateTenantParams {
  name: string;
  audience: string;
  sender_name: string;
  sender_email: string;
  id?: string;
}

export interface TenantsDataAdapter {
  create(params: CreateTenantParams): Promise<Tenant>;
  get(id: string): Promise<Tenant | undefined>;
  list(params: ListParams): Promise<{ tenants: Tenant[]; totals?: Totals }>;
  update(id: string, tenant: Partial<Tenant>): Promise<void>;
  remove(tenantId: string, id: string): Promise<boolean>;
}
