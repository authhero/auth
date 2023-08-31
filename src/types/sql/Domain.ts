export interface SqlDomain {
  id: string;
  tenantId: string;
  createdAt: string;
  modifiedAt: string;
  domain: string;
  dkimPrivateKey?: string;
  dkimPublicKey?: string;
  apiKey?: string;
  mailService?: "mailgun" | "mailchannels";
}
