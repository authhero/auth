import {
  Tenant,
  Application,
  User,
  Connection,
  AdminUser,
  Migration,
} from "./";

// Keys of this interface are table names.
export interface Database {
  users: User;
  admin_users: AdminUser;
  applications: Application;
  connections: Connection;
  migrations: Migration;
  tenants: Tenant;
}
