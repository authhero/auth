import { UniversalLoginSession } from "../../interfaces/UniversalLoginSession";

export function update(sessionsStorage: UniversalLoginSession[]) {
  return async (
    id: string,
    session: UniversalLoginSession,
  ): Promise<boolean> => {
    const index = sessionsStorage.findIndex((item) => item.id === id);
    sessionsStorage[index] = {
      ...sessionsStorage[index],
      ...session,
    };

    return index !== -1;
  };
}
