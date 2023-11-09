export interface UserTag {
  name: string;
  category: string;
}

export interface BaseUser {
  id: string;
  email: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  locale?: string;
}

export interface User extends BaseUser {}

export interface SqlUser extends BaseUser {
  // TODO - remove this field from SQL
  tags?: string;
}
