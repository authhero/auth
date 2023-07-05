import { Tenant, Application, User, AuthProvider, Connection } from "./";

// Keys of this interface are table names.
export interface Database {
  users: User;
  applications: Application;
  connections: Connection;
  tenants: Tenant;
  authProviders: AuthProvider;
}
