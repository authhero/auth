import { AuthorizationResponseType } from "./AuthParams";

export interface OTP {
  id: string;
  tenant_id: string;
  client_id: string;
  email: string;
  code: string;
  send: "link" | "code";
  authParams: {
    nonce?: string;
    state?: string;
    scope?: string;
    response_type?: AuthorizationResponseType;
    redirect_uri?: string;
  };
  created_at: Date;
  expires_at: Date;
  used_at?: Date;
  user_id?: string;
}
