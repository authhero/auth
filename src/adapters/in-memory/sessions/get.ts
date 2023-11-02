import { Session } from "../../../types/Session";

export function get(sessionsStorage: Session[]) {
  return async (id: string): Promise<Session | null> => {
    return sessionsStorage.find((session) => session.id === id) || null;
  };
}
