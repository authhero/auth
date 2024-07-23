import { User } from "@authhero/adapter-interfaces";

export type SqlUser = Omit<User, "is_social" | "email_verified"> & {
  tenant_id: string;
  user_id: string;
  is_social: number;
  email_verified: number;
};
