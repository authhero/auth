import { createUsersAdapter } from "./users";
import { createMembersAdapter } from "./members";
import { createTenantsAdapter } from "./tenants";
import { createLogsAdapter } from "./logs";
import { Database } from "../../types";
import { createSessionsAdapter } from "./sessions";
import { createTicketsAdapter } from "./tickets";
import { createOTPAdapter } from "./otps";
import { createPasswordAdapter } from "./passwords";
import { createCodesAdapter } from "./codes";
import { createUniversalLoginSessionAdapter } from "./universalLoginSessions";
import { createApplicationsAdapter } from "./applications";
import { createConnectionsAdapter } from "./connections";
import { Kysely } from "kysely";

export default function createAdapters(db: Kysely<Database>) {
  return {
    applications: createApplicationsAdapter(db),
    members: createMembersAdapter(db),
    users: createUsersAdapter(db),
    sessions: createSessionsAdapter(db),
    tenants: createTenantsAdapter(db),
    tickets: createTicketsAdapter(db),
    universalLoginSessions: createUniversalLoginSessionAdapter(db),
    OTP: createOTPAdapter(db),
    logs: createLogsAdapter(db),
    passwords: createPasswordAdapter(db),
    codes: createCodesAdapter(db),
    connections: createConnectionsAdapter(db),
  };
}
