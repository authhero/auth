export interface Migration {
  id: string;
  provider: string;
  tenantId: string;
  clientId: string;
  origin: string;
  domain: string;
  createdAt: string;
  modifiedAt: string;
}
