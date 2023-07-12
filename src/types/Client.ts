import { Connection } from "./sql";

export interface Client {
  id: string;
  name: string;
  audience: string;
  issuer: string;
  senderEmail: string;
  senderName: string;
  loginBaseUrl: string;
  connections: Connection[];
  allowedCallbackUrls: string[];
  allowedLogoutUrls: string[];
  allowedWebOrigins: string[];
  tenantId: string;
  clientSecret: string;
}
