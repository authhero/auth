import { AppMetadata } from "./AppMetadata";
import { Identity } from "./Identity";
import { Totals } from "./Totals";
import { UserMetadata } from "./UserMetadata";

interface BaseUser {
  email?: string;
  phone_number?: string;
  user_metadata?: UserMetadata;
  app_metadata?: AppMetadata;
  given_name?: string;
  family_name?: string;
  name?: string;
  nickname?: string;
  picture?: string;
  user_id?: string;
  blocked?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
}

export interface PostUsersBody extends BaseUser {
  password?: string;
  verify_email?: boolean;
  username?: string;
  connection?: string;
}

export interface UserResponse extends BaseUser {
  email: string; // Overriding: email is mandatory in GetUserResponse
  username: string;
  created_at: string;
  updated_at: string;
  identities: Identity[];
  logins_count: number;
  multifactor?: string[];
  last_ip?: string;
  last_login?: string;
  [key: string]: any;
}

export interface GetUserResponseWithTotals extends Totals {
  data: UserResponse[];
}
