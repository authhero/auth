import {
  Tenant,
  Application,
  Certificate,
  SqlConnection,
  Member,
  Migration,
  SqlSession,
  SqlUser,
  SqlCode,
  SqlDomain,
  SqlTicket,
  SqlOTP,
  SqlPassword,
  SqlUniversalLoginSession,
  SqlLog,
} from "../";

// Keys of this interface are table names.
export interface Database {
  codes: SqlCode;
  domains: SqlDomain;
  keys: Certificate;
  users: SqlUser;
  members: Member;
  applications: Application;
  connections: SqlConnection;
  migrations: Migration;
  otps: SqlOTP;
  passwords: SqlPassword;
  sessions: SqlSession;
  tenants: Tenant;
  tickets: SqlTicket;
  universal_login_sessions: SqlUniversalLoginSession;
  logs: SqlLog;
}
