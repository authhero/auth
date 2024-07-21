import { ClientsAdapter } from "./Clients";
import { TicketsAdapter } from "./Tickets";
import { UserDataAdapter } from "./Users";
import { LogsDataAdapter } from "./Logs";
import { KeysAdapter } from "./Keys";
import {
  ApplicationsAdapter,
  AuthenticationCodesAdapter,
  BrandingAdapter,
  CodesAdapter,
  ConnectionsAdapter,
  DomainsAdapter,
  HooksAdapter,
  OTPAdapter,
  PasswordsAdapter,
  SessionsAdapter,
  TenantsDataAdapter,
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
