import { Session } from "../../types/Session";

export interface SessionsAdapter {
  create: (session: Session) => Promise<void>;
  get: (id: string) => Promise<Session | null>;
}
