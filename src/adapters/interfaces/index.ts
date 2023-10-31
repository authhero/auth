import { CertificatesAdapter } from "./Certificates";
import { MembersDataAdapter } from "./Members";
import { TenantsDataAdapter } from "./Tenants";
import { UserDataAdapter } from "./User";

export interface DataAdapters {
  certificates: CertificatesAdapter;
  members: MembersDataAdapter;
  tenants: TenantsDataAdapter;
  users: UserDataAdapter;
}
