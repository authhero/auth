import { SqlBranding } from "../../types/sql/Branding";
import {
  Migration,
  SqlTicket,
  SqlOTP,
  SqlPassword,
  SqlUniversalLoginSession,
  SqlLog,
} from "../../types";
import { SqlAuthenticationCode } from "../../types/sql/AuthenticationCode";
import { SqlUser } from "../../types/sql/User";
import {
  Application,
  Certificate,
  Code,
  Connection,
  Domain,
  Hook,
  Tenant,
} from "@authhero/adapter-interfaces";

// TODO: Update the colums to match the session entity
interface SqlSession {
  tenant_id: string;
  created_at: string;
  user_id: string;
  client_id: string;
  expires_at: string;
  used_at: string;
  id: string;
  deleted_at?: string | undefined;
}

// Keys of this interface are table names.
export interface Database {
  authentication_codes: SqlAuthenticationCode;
  branding: SqlBranding & { tenant_id: string };
  codes: Code & { tenant_id: string };
  domains: Domain & { tenant_id: string };
  hooks: Hook & { tenant_id: string };
  keys: Certificate;
  // TODO: keep the id here for now until we changed primary key
  users: SqlUser;
  applications: Application & { tenant_id: string };
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
