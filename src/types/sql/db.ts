import {
  Tenant,
  Application,
  SqlConnection,
  Member,
  Migration,
  Session,
  SqlUser,
  SqlCode,
  SqlDomain,
  SqlTicket,
  SqlOTP,
  SqlPassword,
  SqlUniversalLoginSession,
  Log,
} from "../";

// Keys of this interface are table names.
export interface Database {
  codes: SqlCode;
  domains: SqlDomain;
  users: SqlUser;
  members: Member;
  applications: Application;
  connections: SqlConnection;
  migrations: Migration;
  otps: SqlOTP;
  passwords: SqlPassword;
  sessions: Session;
  tenants: Tenant;
  tickets: SqlTicket;
  universal_login_sessions: SqlUniversalLoginSession;
  logs: Log;
}
