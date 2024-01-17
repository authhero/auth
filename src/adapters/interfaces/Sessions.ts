import { Session } from "../../types/Session";

export interface SessionsAdapter {
  create: (session: Session) => Promise<void>;
  get: (tenant_id: string, id: string) => Promise<Session | null>;
  update: (
    tenant_id: string,
    id: string,
    session: { used_at: string },
  ) => Promise<boolean>;
  remove: (tenant_id: string, id: string) => Promise<boolean>;
}
