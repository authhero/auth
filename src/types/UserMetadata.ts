import { Generated } from "kysely";

export interface UserBase {
  email: string;
  clientId: string;
  firstName?: string;
  lastName?: string;
}

export interface UserTable extends UserBase {
  id: Generated<number>;
}

export interface User extends UserBase {
  id: number;
}
