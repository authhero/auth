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
  created_at: string;
  modified_at: string;
}
