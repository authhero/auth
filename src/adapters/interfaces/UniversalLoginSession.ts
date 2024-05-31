import { AuthParams } from "../../types";

export interface UniversalLoginSession {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  authParams: AuthParams;
  auth0Client?: string;
}

export interface UniversalLoginSessionsAdapter {
  create: (session: UniversalLoginSession) => Promise<void>;
  update: (id: string, session: UniversalLoginSession) => Promise<boolean>;
  get: (id: string) => Promise<UniversalLoginSession | null>;
}
