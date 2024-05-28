import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "../AuthParams";

export interface SqlAuthenticationCode {
  code: string;
  tenant_id: string;
  client_id: string;
  user_id: string;
  nonce?: string;
  state?: string;
  scope?: string;
  response_type?: AuthorizationResponseType;
  response_mode?: AuthorizationResponseMode;
  redirect_uri?: string;
  created_at: string;
  expires_at: string;
  used_at?: string;
}
