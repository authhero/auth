// Entity from auth0
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

export interface UserTag {
  name: string;
  category: string;
}

export interface BaseUser {
  id: string;
  email: string;
  tenantId: string;
  createdAt: string;
  modifiedAt: string;
  givenName?: string;
  familyName?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  locale?: string;
}

export interface User extends BaseUser {
  tags: UserTag[];
}

export interface SqlUser extends BaseUser {
  tags: string;
}
