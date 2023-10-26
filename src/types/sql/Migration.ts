export interface Migration {
  id: string;
  provider: string;
  tenant_id: string;
  client_id: string;
  origin: string;
  domain: string;
  created_at: string;
  updated_at: string;
}
