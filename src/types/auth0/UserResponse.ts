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
  // I think we should be stricter with this
  // I need to check the auth0-mgmt-api library
  // I'm not too sure if it's required from the docs
  // https://auth0.com/docs/api/management/v2/users/post-users
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
  user_id: string;
  [key: string]: any;
}

// this type is a duplicate of ListUsersResponse
export interface GetUserResponseWithTotals extends Totals {
  users: UserResponse[];
}
