import { CertificatesAdapter } from "./Certificates";
import { ClientsAdapter } from "./Clients";
import { EmailAdapter } from "./Email";
import { MembersDataAdapter } from "./Members";
import { OTPAdapter } from "./OTP";
import { SessionsAdapter } from "./Sessions";
import { TenantsDataAdapter } from "./Tenants";
import { TicketsAdapter } from "./Tickets";
import { UserDataAdapter } from "./Users";
import { LogsDataAdapter } from "./Logs";

export interface DataAdapters {
  certificates: CertificatesAdapter;
  clients: ClientsAdapter;
  email: EmailAdapter;
  members: MembersDataAdapter;
  OTP: OTPAdapter;
  sessions: SessionsAdapter;
  tenants: TenantsDataAdapter;
  tickets: TicketsAdapter;
  users: UserDataAdapter;
  logs: LogsDataAdapter;
}
