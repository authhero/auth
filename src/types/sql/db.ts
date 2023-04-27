import { Tenant, Application, User, AuthProvider } from "./";

// Keys of this interface are table names.
export interface Database {
  users: User;
  applications: Application;
  tenants: Tenant;
  authProviders: AuthProvider;
}
