import { Tenant, Organization, Application, User } from "./";

// Keys of this interface are table names.
export interface Database {
  users: User;
  applications: Application;
  tenants: Tenant;
  organizations: Organization;
}
