export interface UserTag {
  name: string;
  category: string;
}

interface BaseSqlUser {
  // should this be optional?
  // I want the adapter interface to only use Sql types right?
  // SO YES! then extend from this...
  // SqlCreateUser? Hmmmm TBD
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
