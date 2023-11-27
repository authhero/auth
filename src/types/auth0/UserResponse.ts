import { BaseUser } from "../User";
import { AppMetadata } from "./AppMetadata";
import { Identity, IdentityWithProfileData } from "./Identity";
import { Totals } from "./Totals";
import { UserMetadata } from "./UserMetadata";

export interface PostUsersBody extends BaseUser {
  password?: string;
  verify_email?: boolean;
  username?: string;
  connection?: string;
}

export interface UserResponse extends BaseUser {
  email: string; // Overriding: email is mandatory in GetUserResponse
  created_at: string;
  updated_at: string;
  // this syntax means the first elements is one type and the rest is another type
  identities: [Identity, ...IdentityWithProfileData[]];
  login_count: number;
  multifactor?: string[];
  last_ip?: string;
  last_login?: string;
  user_id: string;
  [key: string]: any;
}

export interface GetUserResponseWithTotals extends Totals {
  users: UserResponse[];
}
