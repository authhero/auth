import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "./AuthParams";

export interface OTP {
  id: string;
  tenant_id: string;
  client_id: string;
  email: string;
  code: string;
  ip?: string;
  send: "link" | "code";
  authParams: {
    nonce?: string;
    state?: string;
    scope?: string;
    response_type?: AuthorizationResponseType;
    response_mode?: AuthorizationResponseMode;
    redirect_uri?: string;
  };
  created_at: Date;
  expires_at: Date;
  used_at?: string;
  user_id?: string;
}
