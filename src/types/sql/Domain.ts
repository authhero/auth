export interface SqlDomain {
  id: string;
  tenantId: string;
  created_at: string;
  modified_at: string;
  domain: string;
  dkimPrivateKey?: string;
  dkimPublicKey?: string;
  apiKey?: string;
  emailService?: "mailgun" | "mailchannels";
}
