export interface Application {
  id: string;
  name: string;
  tenantId: string;
  allowedWebOrigins: string;
  allowedCallbackUrls: string;
  allowedLogoutUrls: string;
}
