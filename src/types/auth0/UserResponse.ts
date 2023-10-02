import { AppMetadata } from "./AppMetadata";
import { Identity } from "./Identity";
import { Totals } from "./Totals";
import { UserMetadata } from "./UserMetadata";

export interface GetUserResponse {
  user_id: string;
  email: string;
  email_verified: boolean;
  username: string;
  phone_number: string;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
  identities: Identity[];
  app_metadata?: AppMetadata;
  user_metadata?: UserMetadata;
  picture?: string;
  name?: string;
  nickname?: string;
  multifactor?: string[];
  last_ip?: string;
  last_login?: string;
  logins_count: number;
  blocked?: boolean;
  given_name?: string;
  family_name?: string;
  [key: string]: any;
}

export interface GetUserResponseWithTotals extends Totals {
  users: GetUserResponse[];
}
