export interface Connection {
  id: string;
  name: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  createdAt: string;
  modifiedAt: string;
}
