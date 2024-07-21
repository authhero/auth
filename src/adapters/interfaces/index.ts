import { ClientsAdapter } from "./Clients";
import { UserDataAdapter } from "./Users";
import { LogsDataAdapter } from "./Logs";
import {
  ApplicationsAdapter,
  AuthenticationCodesAdapter,
  BrandingAdapter,
  CodesAdapter,
  ConnectionsAdapter,
  DomainsAdapter,
  HooksAdapter,
  KeysAdapter,
  OTPAdapter,
  PasswordsAdapter,
  SessionsAdapter,
  TenantsDataAdapter,
  TicketsAdapter,
  UniversalLoginSessionsAdapter,
} from "@authhero/adapter-interfaces";

export interface DataAdapters {
  applications: ApplicationsAdapter;
  branding: BrandingAdapter;
  codes: CodesAdapter;
  clients: ClientsAdapter;
  OTP: OTPAdapter;
  passwords: PasswordsAdapter;
  sessions: SessionsAdapter;
  tenants: TenantsDataAdapter;
  tickets: TicketsAdapter;
  universalLoginSessions: UniversalLoginSessionsAdapter;
  users: UserDataAdapter;
  logs: LogsDataAdapter;
  connections: ConnectionsAdapter;
  domains: DomainsAdapter;
  keys: KeysAdapter;
  hooks: HooksAdapter;
  authenticationCodes: AuthenticationCodesAdapter;
}
