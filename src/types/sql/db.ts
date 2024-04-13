import {
  Tenant,
  Application,
  Certificate,
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
import { Connection } from "../Connection";

// Keys of this interface are table names.
export interface Database {
  codes: SqlCode;
  domains: SqlDomain;
  keys: Certificate;
  users: SqlUser;
  members: Member;
  applications: Application;
  connections: Connection & { tenant_id: string };
  migrations: Migration;
  otps: SqlOTP;
  passwords: SqlPassword;
  sessions: SqlSession;
  tenants: Tenant;
  tickets: SqlTicket;
  universal_login_sessions: SqlUniversalLoginSession;
  logs: SqlLog;
}
