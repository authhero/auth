export interface Migration {
  id: string;
  provider: string;
  tenantId: string;
  clientId: string;
  origin: string;
  domain: string;
  created_at: string;
  modified_at: string;
}
