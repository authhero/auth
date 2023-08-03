import { SqlConnection } from "./sql";

export interface Client {
  id: string;
  name: string;
  audience: string;
  senderEmail: string;
  senderName: string;
  connections: SqlConnection[];
  allowedCallbackUrls: string[];
  allowedLogoutUrls: string[];
  allowedWebOrigins: string[];
  emailValidation: "enabled" | "disabled" | "enforced";
  tenantId: string;
  clientSecret: string;
}
