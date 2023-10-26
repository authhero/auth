import { DataAdapters } from "../interfaces";
import { createCertificateAdapter } from "./certificates";
import { createUserAdapter } from "./user";
import { createMembersAdapter } from "./members";
import { createTenantsAdapter } from "./tenants";
import { createLogsAdapter } from "./logs";

export default function createAdapters(): DataAdapters {
  return {
    certificates: createCertificateAdapter(),
    members: createMembersAdapter(),
    users: createUserAdapter(),
    tenants: createTenantsAdapter(),
  };
}
