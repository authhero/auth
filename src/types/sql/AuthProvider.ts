export interface AuthProvider {
  id: string;
  name: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  profileEndpoint: string;
  createdAt: string;
  modifiedAt: string;
}
