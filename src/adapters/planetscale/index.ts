import { createUsersAdapter } from "./users";
import { createMembersAdapter } from "./members";
import { createTenantsAdapter } from "./tenants";
import { Env } from "../../types";
import { createSessionsAdapter } from "./sessions";

export default function createAdapters(env: Env) {
  return {
    members: createMembersAdapter(env),
    users: createUsersAdapter(env),
    sessions: createSessionsAdapter(env),
    tenants: createTenantsAdapter(env),
  };
}
