import { ClientsAdapter } from "./Clients";
import { CodesAdapter } from "./Codes";
import { EmailAdapter } from "./Email";
import { MembersDataAdapter } from "./Members";
import { OTPAdapter } from "./OTP";
import { PasswordsAdapter } from "./Passwords";
import { SessionsAdapter } from "./Sessions";
import { TenantsDataAdapter } from "./Tenants";
import { TicketsAdapter } from "./Tickets";
import { UserDataAdapter } from "./Users";
import { LogsDataAdapter } from "./Logs";
import { ApplicationsAdapter } from "./Applications";
import { UniversalLoginSessionsAdapter } from "./UniversalLoginSession";
import { TemplatesAdapter } from "./Templates";
import { ConnectionsAdapter } from "./Connections";
import { DomainsAdapter } from "./Domains";
import { KeysAdapter } from "./Keys";

export interface DataAdapters {
  applications: ApplicationsAdapter;
  codes: CodesAdapter;
  clients: ClientsAdapter;
  email: EmailAdapter;
  members: MembersDataAdapter;
  OTP: OTPAdapter;
  passwords: PasswordsAdapter;
  sessions: SessionsAdapter;
  tenants: TenantsDataAdapter;
  tickets: TicketsAdapter;
  universalLoginSessions: UniversalLoginSessionsAdapter;
  users: UserDataAdapter;
  logs: LogsDataAdapter;
  templates: TemplatesAdapter;
  connections: ConnectionsAdapter;
  domains: DomainsAdapter;
  keys: KeysAdapter;
}
