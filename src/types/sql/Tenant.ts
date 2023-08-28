export interface Tenant {
  id: string;
  name: string;
  audience: string;
  senderEmail: string;
  senderName: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  language?: string;
  createdAt: string;
  modifiedAt: string;
}
