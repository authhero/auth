export interface SqlDomain {
  id: string;
  tenant_id: string;
  created_at: string;
  modified_at: string;
  domain: string;
  dkim_private_key?: string;
  dkim_public_key?: string;
  api_key?: string;
  email_service?: "mailgun" | "mailchannels";
}
