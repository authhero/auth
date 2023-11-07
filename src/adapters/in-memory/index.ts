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
import { createLogsAdapter } from "./logs";

export default function createAdapters(): DataAdapters {
  return {
    certificates: createCertificateAdapter(),
    clients: createClientsAdapter(),
    email: emailAdapter(),
    members: createMembersAdapter(),
    OTP: createOTPAdapter(),
    users: createUserAdapter(),
    sessions: createSessionsAdapter(),
    tenants: createTenantsAdapter(),
    tickets: createTicketsAdapter(),
    logs: createLogsAdapter(),
  };
}
