import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "@authhero/adapter-interfaces";

export interface Ticket {
  id: string;
  tenant_id: string;
  client_id: string;
  email: string;
  authParams?: {
    nonce?: string;
    state?: string;
    scope?: string;
    response_type?: AuthorizationResponseType;
    response_mode?: AuthorizationResponseMode;
    redirect_uri?: string;
  };
  created_at: Date;
  expires_at: Date;
  used_at?: Date;
}
