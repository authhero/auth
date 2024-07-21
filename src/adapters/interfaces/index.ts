import { ClientsAdapter } from "./Clients";
import { MembersDataAdapter } from "./Members";
import { PasswordsAdapter } from "./Passwords";
import { TenantsDataAdapter } from "./Tenants";
import { TicketsAdapter } from "./Tickets";
import { UserDataAdapter } from "./Users";
import { LogsDataAdapter } from "./Logs";
import { ConnectionsAdapter } from "./Connections";
import { KeysAdapter } from "./Keys";
import {
  ApplicationsAdapter,
  AuthenticationCodesAdapter,
  BrandingAdapter,
  CodesAdapter,
  DomainsAdapter,
  HooksAdapter,
  OTPAdapter,
  SessionsAdapter,
  UniversalLoginSessionsAdapter,
} from "@authhero/adapter-interfaces";

export interface DataAdapters {
  applications: ApplicationsAdapter;
  branding: BrandingAdapter;
  codes: CodesAdapter;
  clients: ClientsAdapter;
  members: MembersDataAdapter;
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
