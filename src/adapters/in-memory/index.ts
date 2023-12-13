import { DataAdapters } from "../interfaces";
import { createCertificateAdapter } from "./certificates";
import { createUserAdapter } from "./users";
import { createMembersAdapter } from "./members";
import { createTenantsAdapter } from "./tenants";
import { createClientsAdapter } from "./clients";
import { emailAdapter } from "./email";
import { createOTPAdapter } from "./OTP";
import { createTicketsAdapter } from "./tickets";
import { createSessionsAdapter } from "./sessions";
import { createCodesAdapter } from "./Codes";
import { createPasswordsAdapter } from "./Passwords";
import { createLogsAdapter } from "./logs";
import { createApplicationsAdapter } from "./applications";
import { createUniversalLoginSessionsAdapter } from "./universal-auth-sessions";
import { createConnectionsAdapter } from "./connections";
import { Application, SqlConnection, Client, Tenant } from "../../types";

export default function createAdapters(): DataAdapters {
  const connections: SqlConnection[] = [];
  const tenants: Tenant[] = [];
  const applications: Application[] = [];
  // TODO - derive this from others!
  const clientStorage: Client[] = [];

  return {
    applications: createApplicationsAdapter(applications),
    certificates: createCertificateAdapter(),
    codes: createCodesAdapter(),
    clients: createClientsAdapter(clientStorage),
    email: emailAdapter(),
    members: createMembersAdapter(),
    OTP: createOTPAdapter(),
    passwords: createPasswordsAdapter(),
    universalLoginSessions: createUniversalLoginSessionsAdapter(),
    users: createUserAdapter(),
    sessions: createSessionsAdapter(),
    tenants: createTenantsAdapter(tenants),
    tickets: createTicketsAdapter(),
    logs: createLogsAdapter(),
    connections: createConnectionsAdapter(connections),
    templates: {
      get: async (...inputs) => `<div>${JSON.stringify(inputs, null, 2)}</div>`,
    },
  };
}
