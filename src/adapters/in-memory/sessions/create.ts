import { Session } from "../../../types/Session";

export function create(sessionsStorage: Session[]) {
  return async (session: Session): Promise<void> => {
    sessionsStorage.push(session);
  };
}
