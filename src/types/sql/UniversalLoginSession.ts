import { UniversalLoginSession } from "../../adapters/interfaces/UniversalLoginSession";
import { AuthParams } from "../AuthParams";

export interface SqlUniversalLoginSession
  extends Omit<UniversalLoginSession, "authParams">,
    AuthParams {}
