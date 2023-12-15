export interface SqlDomain {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  domain: string;
  dkim_private_key?: string;
  dkim_public_key?: string;
  email_api_key?: string;
  email_service?: "mailgun" | "mailchannels";
}
