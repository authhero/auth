import { UserTable } from "./UserMetadata";

// Keys of this interface are table names.
export interface Database {
  users: UserTable;
}
