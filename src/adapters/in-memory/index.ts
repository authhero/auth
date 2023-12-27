import { DataAdapters } from "../interfaces";
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
import { Application, SqlConnection, Tenant, SqlDomain } from "../../types";
import { createDomainsAdapter } from "./domains";
import { createKeysAdapter } from "./keys";

export default function createAdapters(): DataAdapters {
  const connections: SqlConnection[] = [];
  const tenants: Tenant[] = [];
  const applications: Application[] = [];
  const domains: SqlDomain[] = [];

  return {
    applications: createApplicationsAdapter(applications),
    codes: createCodesAdapter(),
    clients: createClientsAdapter(applications, tenants, connections, domains),
    email: emailAdapter(),
    keys: createKeysAdapter(),
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
    domains: createDomainsAdapter(domains),
    templates: {
      get: async (...inputs) => `<div>${JSON.stringify(inputs, null, 2)}</div>`,
    },
  };
}
