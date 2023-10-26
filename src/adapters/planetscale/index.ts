import { createUsersAdapter } from "./users";
import { createMembersAdapter } from "./members";
import { createTenantsAdapter } from "./tenants";
import { createLogsAdapter } from "./logs";
import { Env } from "../../types";

export default function createAdapters(env: Env) {
  return {
    members: createMembersAdapter(env),
    users: createUsersAdapter(env),
    tenants: createTenantsAdapter(env),
    logs: createLogsAdapter(env),
  };
}
