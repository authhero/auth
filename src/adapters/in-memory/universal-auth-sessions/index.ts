import { create } from "./create";
import { get } from "./get";
import {
  UniversalLoginSessionsAdapter,
  UniversalLoginSession,
} from "../../interfaces/UniversalLoginSession";
import { update } from "./update";

export function createUniversalLoginSessionsAdapter(): UniversalLoginSessionsAdapter {
  const sessionsStorage: UniversalLoginSession[] = [];

  return {
    create: create(sessionsStorage),
    get: get(sessionsStorage),
    update: update(sessionsStorage),
  };
}
