export interface Identity {
  connection: string;
  user_id: string;
  provider: string;
  isSocial: boolean;
  access_token?: string;
  access_token_secret?: string;
  refresh_token?: string;
  profileData?: {
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
