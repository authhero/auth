import { User } from "../../../types";

export type SqlUser = User & {
  tenant_id: string;
  id: string;
  is_social: number;
  is_verified: number;
  email_verified: number;
};
