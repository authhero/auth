import { z } from "zod";

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

// what is this used for? ahhh, I think this is just the same Auth0 type I've made in UserResponse...  compare and combine... BUT name after Auth0
interface Connection {
  name: string;
  profile?: { [key: string]: string | boolean | number };
}

// can we nuke this now? and the profile schema? that's the whole point of this ticket!
export type Profile = {
  id: string; // nope, this doesn't match auth0
  tenant_id: string; // and this also doesn't exist on auth0!
  email: string;
  created_at: string;
  updated_at: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  locale?: string;
  // up until here it's just SQL user, but then with Connections also... which isn't an Auth0 field
  linked_with?: string;
  connections: Connection[]; // and another one! looks more like SqlUser
};

const ConnectionSchema = z.object({
  name: z.string(),
  profile: z.record(z.union([z.string(), z.boolean(), z.number()])).optional(),
});

export const ProfileSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  email: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  nickname: z.string().optional(),
  name: z.string().optional(),
  picture: z.string().optional(),
  locale: z.string().optional(),
  connections: z.array(ConnectionSchema),
});
