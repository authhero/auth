import { create } from "./create";
import { get } from "./get";
import { SessionsAdapter } from "../../interfaces/Sessions";
import { Session } from "../../../types/Session";

export function createSessionsAdapter(): SessionsAdapter {
  const sessionsStorage: Session[] = [];

  return {
    create: create(sessionsStorage),
    get: get(sessionsStorage),
  };
}
