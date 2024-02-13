import { LogType } from "./auth0";

export type Var = {
  vendorId?: string;
  startAt: number;
  userId?: string;
  tenantId?: string;
  log: string;
  logType: LogType;
  client_id?: string;
  description?: string;
  user?: {
    sub: string;
    azp: string;
    permissions: string[];
  };
  userName?: string;
  connectionId?: string;
  connection?: string;
  // TODO - enable these, populate, and use
  //   strategy?: string;
  //   strategyType?: string;
  //   sessionConnection?: string;
  //   audience?: string;
  //   scope?: string;
  // can we get this from user agent?
  //   isMobile?: boolean;
  // is this a header? what other project am I reading this on... login2!
  //   auth0Client?: string;
};
