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
  SqlTemplate,
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
  templates: SqlTemplate;
  tenants: Tenant;
  tickets: SqlTicket;
  universal_login_sessions: SqlUniversalLoginSession;
  logs: SqlLog;
}
