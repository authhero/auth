import { AuthorizationResponseType } from "../AuthParams";

export interface SqlOTP {
  id: string;
  tenant_id: string;
  client_id: string;
  email: string;
  code: string;
  send: "link" | "code";
  nonce?: string;
  state?: string;
  scope?: string;
  response_type?: AuthorizationResponseType;
  redirect_uri?: string;
  created_at: string;
  expires_at: string;
  used_at?: string;
  user_id?: string;
}
