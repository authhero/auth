import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "@authhero/adapter-interfaces";

export interface SqlUniversalLoginSession {
  id: string;
  tenant_id: string;
  client_id: string;
  email?: string;
  nonce?: string;
  state?: string;
  scope?: string;
  response_type?: AuthorizationResponseType;
  response_mode?: AuthorizationResponseMode;
  redirect_uri?: string;
  code_challenge_method?: string;
  code_challenge?: string;
  username?: string;
  vendor_id?: string;
  audience?: string;
  created_at: string;
  expires_at: string;
  updated_at: string;
}
