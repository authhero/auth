import { UniversalLoginSession } from "../../interfaces/UniversalLoginSession";

export function get(sessionsStorage: UniversalLoginSession[]) {
  return async (id: string): Promise<UniversalLoginSession | null> => {
    return sessionsStorage.find((session) => session.id === id) || null;
  };
}
