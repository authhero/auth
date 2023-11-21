export interface BaseUser {
  // TODO - Auth0 requires the id OR the email but for our current usage with durable objects and Sesamy's architecture, we need email!
  email: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  locale?: string;
  email_verified: boolean;
  last_ip?: string;
  last_login?: string;
  login_count: number;
  provider: string;
  connection: string;
  is_social: boolean;
}

export interface User extends BaseUser {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}
