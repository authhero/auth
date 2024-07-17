import { UniversalLoginSession } from "@authhero/adapter-interfaces";
import { AuthParams } from "../AuthParams";

export interface SqlUniversalLoginSession
  extends Omit<UniversalLoginSession, "authParams">,
    AuthParams {}
