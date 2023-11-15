import { AppMetadata } from "./AppMetadata";
import { Identity } from "./Identity";
import { Totals } from "./Totals";
import { UserMetadata } from "./UserMetadata";

// Entity from auth0 - this is what the types here should reflect
// {
//   "email": "jane@exampleco.com",
//   "email_verified": false,
//   "username": "janedoe",
//   "phone_number": "+199999999999999",
//   "phone_verified": false,
//   "user_id": "auth0|5457edea1b8f22891a000004",
//   "created_at": "",
//   "updated_at": "",
//   "identities": [
//     {
//       "connection": "Initial-Connection",
//       "user_id": "5457edea1b8f22891a000004",
//       "provider": "auth0",
//       "isSocial": false
//     }
//   ],
//   "app_metadata": {},
//   "user_metadata": {},
//   "picture": "",
//   "name": "",
//   "nickname": "",
//   "multifactor": [
//     ""
//   ],
//   "last_ip": "",
//   "last_login": "",
//   "logins_count": 0,
//   "blocked": false,
//   "given_name": "",
//   "family_name": ""
// }

interface BaseUser {
  // TODO - to match auth0 we should make a union type so either email or user_id are required
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

export interface GetUserResponseWithTotals extends Totals {
  users: UserResponse[];
}
