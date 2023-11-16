export interface UserTag {
  name: string;
  category: string;
}

interface BaseSqlUser {
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

export interface SqlCreateUser extends BaseSqlUser {
  id?: string;
}

export interface SqlUser extends BaseSqlUser {
  id: string;
  // TODO - remove this field from SQL
  tags?: string;
  created_at: string;
  updated_at: string;
}
