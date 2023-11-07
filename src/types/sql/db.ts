import {
  Tenant,
  Application,
  SqlConnection,
  Member,
  Migration,
  Session,
  SqlUser,
  SqlDomain,
  SqlTicket,
  SqlOTP,
  Log,
} from "../";

// Keys of this interface are table names.
export interface Database {
  domains: SqlDomain;
  users: SqlUser;
  members: Member;
  applications: Application;
  connections: SqlConnection;
  migrations: Migration;
  otps: SqlOTP;
  sessions: Session;
  tenants: Tenant;
  tickets: SqlTicket;
  logs: Log;
}
