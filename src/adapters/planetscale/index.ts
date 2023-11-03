import { createUsersAdapter } from "./users";
import { createMembersAdapter } from "./members";
import { createTenantsAdapter } from "./tenants";
import { Env } from "../../types";
import { createSessionsAdapter } from "./sessions";
import { createTicketsAdapter } from "./tickets";
import { createOTPAdapter } from "./otps";

export default function createAdapters(env: Env) {
  return {
    members: createMembersAdapter(env),
    users: createUsersAdapter(env),
    sessions: createSessionsAdapter(env),
    tenants: createTenantsAdapter(env),
    tickets: createTicketsAdapter(env),
    OTP: createOTPAdapter(env),
  };
}
