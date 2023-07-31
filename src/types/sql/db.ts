import { Tenant, Application, User, Connection, Member, Migration } from "./";

// Keys of this interface are table names.
export interface Database {
  users: User;
  members: Member;
  applications: Application;
  connections: Connection;
  migrations: Migration;
  tenants: Tenant;
}
