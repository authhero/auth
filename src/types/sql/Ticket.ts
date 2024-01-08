import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "../AuthParams";

export interface SqlTicket {
  id: string;
  tenant_id: string;
  client_id: string;
  email: string;
  nonce?: string;
  state?: string;
  scope?: string;
  response_type?: AuthorizationResponseType;
  response_mode?: AuthorizationResponseMode;
  redirect_uri?: string;
  created_at: string;
  expires_at: string;
  used_at?: Date;
}
