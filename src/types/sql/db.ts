import {
  Tenant,
  Application,
  Connection,
  Member,
  Migration,
  SqlUser,
} from "./";

// Keys of this interface are table names.
export interface Database {
  users: SqlUser;
  members: Member;
  applications: Application;
  connections: Connection;
  migrations: Migration;
  tenants: Tenant;
}
