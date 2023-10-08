import { Tenant } from "../../types";
import { Totals } from "../../types/auth0/Totals";

export interface CreateTenantParams {
  name: string;
  audience: string;
  sender_name: string;
  sender_email: string;
  id?: string;
}

export interface TenantsDataAdapter {
  create(params: CreateTenantParams): Promise<Tenant>;
  list(): Promise<{ tenants: Tenant[]; totals?: Totals }>;
}
