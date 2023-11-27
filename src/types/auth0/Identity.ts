export interface Identity {
  connection: string;
  user_id: string;
  provider: string;
  isSocial: boolean;
  access_token?: string;
  access_token_secret?: string;
  refresh_token?: string;
}

export interface IdentityWithProfileData extends Identity {
  profileData: {
    email?: string;
    email_verified?: boolean;
    name?: string;
    username?: string;
    given_name?: string;
    phone_number?: string;
    phone_verified?: boolean;
    family_name?: string;
    [key: string]: any; // Since additionalProperties is true
  };
}

// this syntax means the first elements is one type and the rest is another type
export type UserIdentities = [Identity, ...IdentityWithProfileData[]];
