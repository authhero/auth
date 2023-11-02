import {
  Tenant,
  Application,
  SqlConnection,
  Member,
  Migration,
  SqlUser,
  SqlDomain,
} from "./";

import { Session } from "../Session";

// Keys of this interface are table names.
export interface Database {
  domains: SqlDomain;
  users: SqlUser;
  members: Member;
  applications: Application;
  connections: SqlConnection;
  migrations: Migration;
  sessions: Session;
  tenants: Tenant;
}
