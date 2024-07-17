import { Domain } from "../Domain";
import {
  Tenant,
  Certificate,
  Member,
  Migration,
  SqlSession,
  SqlCode,
  SqlTicket,
  SqlOTP,
  SqlPassword,
  SqlUniversalLoginSession,
  SqlLog,
} from "../";
import { Connection } from "../Connection";
import { SqlBranding } from "./Branding";
import { SqlAuthenticationCode } from "./AuthenticationCode";
import { Hook } from "../Hooks";
import { SqlUser } from "./User";
import { Application } from "@authhero/adapter-interfaces";

// Keys of this interface are table names.
export interface Database {
  authentication_codes: SqlAuthenticationCode;
  branding: SqlBranding;
  codes: SqlCode;
  domains: Domain & { tenant_id: string };
  hooks: Hook & { tenant_id: string };
  keys: Certificate;
  // TODO: keep the id here for now until we changed primary key
  users: SqlUser;
  members: Member;
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
