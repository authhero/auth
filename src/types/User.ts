export interface BaseUser {
  // TODO - Auth0 requires the id OR the email but for our current usage with durable objects and Sesamy's architecture, we need email!
  email: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  locale?: string;
}

export interface User extends BaseUser {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}
