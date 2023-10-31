import { DataAdapters } from "../interfaces";
import { createCertificateAdapter } from "./certificates";
import { createUserAdapter } from "./user";
import { createMembersAdapter } from "./members";
import { createTenantsAdapter } from "./tenants";

export default function createAdapters(): DataAdapters {
  return {
    certificates: createCertificateAdapter(),
    members: createMembersAdapter(),
    users: createUserAdapter(),
    tenants: createTenantsAdapter(),
  };
}
