import { UniversalLoginSession } from "../../interfaces/UniversalLoginSession";

export function create(sessionsStorage: UniversalLoginSession[]) {
  return async (session: UniversalLoginSession): Promise<void> => {
    sessionsStorage.push(session);
  };
}
