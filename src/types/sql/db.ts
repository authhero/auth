import {
  Tenant,
  Application,
  User,
  Connection,
  AdminUser,
  Member,
  Migration,
} from "./";

// Keys of this interface are table names.
export interface Database {
  users: User;
  admin_users: AdminUser;
  members: Member;
  applications: Application;
  connections: Connection;
  migrations: Migration;
  tenants: Tenant;
}
