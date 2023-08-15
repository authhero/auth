import {
  Tenant,
  Application,
  SqlConnection,
  Member,
  Migration,
  SqlUser,
  SqlDomain,
} from "./";

// Keys of this interface are table names.
export interface Database {
  domains: SqlDomain;
  users: SqlUser;
  members: Member;
  applications: Application;
  connections: SqlConnection;
  migrations: Migration;
  tenants: Tenant;
}
