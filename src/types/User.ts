export interface User {
  id: string;
  // TODO - Auth0 requires the id OR the email but for our current usage with durable objects and Sesamy's architecture, we need email!
  email: string;
  tenant_id: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  locale?: string;
}
