import { Tenant, Application, User, Connection, AdminUser } from "./";

// Keys of this interface are table names.
export interface Database {
  users: User;
  admin_users: AdminUser;
  applications: Application;
  connections: Connection;
  tenants: Tenant;
}
