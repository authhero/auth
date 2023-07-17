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

interface Connection {
  name: string;
  profile?: { [key: string]: string | boolean | number };
}

export interface Profile {
  id: string;
  // TODO: this should probably be snake cased as well. Or maybe stored somewhere else
  tenantId: string;
  email: string;
  created_at: string;
  modified_at: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  locale?: string;
  connections: Connection[];
}
