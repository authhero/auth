import { User } from "@authhero/adapter-interfaces";

export type SqlUser = User & {
  tenant_id: string;
  id: string;
  is_social: number;
  is_verified: number;
  email_verified: number;
};
