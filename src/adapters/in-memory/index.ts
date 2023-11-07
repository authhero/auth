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

export default function createAdapters(): DataAdapters {
  return {
    certificates: createCertificateAdapter(),
    codes: createCodesAdapter(),
    clients: createClientsAdapter(),
    email: emailAdapter(),
    members: createMembersAdapter(),
    OTP: createOTPAdapter(),
    passwords: createPasswordsAdapter(),
    users: createUserAdapter(),
    sessions: createSessionsAdapter(),
    tenants: createTenantsAdapter(),
    tickets: createTicketsAdapter(),
    logs: createLogsAdapter(),
  };
}
