import { LogType } from "./auth0";

export type Var = {
  vendorId?: string;
  startAt: number;
  email?: string;
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
  // TODO - enable these, populate, and use
  //   userName?: string;
  //   connectionId?: string;
  //   strategy?: string;
  //   strategyType?: string;
  //   hostname?: string;
  //   sessionConnection?: string;
  //   connection?: string;
  //   audience?: string;
  //   scope?: string;
  //   isMobile?: boolean;
  //   auth0Client?: string;
};
