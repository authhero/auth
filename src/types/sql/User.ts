import { BaseUser } from "../User";

export interface SqlUser extends BaseUser {
  id: string;
  user_id: string;
  // the only difference between this and User is that email_verified and is_social are integers
  // we could extract out a more common type between them...
  // we can't add more to BaseUser though as this is used in creating and updating users
  email_verified: number;
  last_ip?: string;
  last_login?: string;
  login_count: number;
  provider: string;
  connection: string;
  is_social: number;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}
