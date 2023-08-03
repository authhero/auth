import {
  Tenant,
  Application,
  SqlConnection,
  Member,
  Migration,
  SqlUser,
} from "./";

// Keys of this interface are table names.
export interface Database {
  users: SqlUser;
  members: Member;
  applications: Application;
  connections: SqlConnection;
  migrations: Migration;
  tenants: Tenant;
}
