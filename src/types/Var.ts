import { LogType, Auth0Client } from "./auth0";
import { z } from "zod";

export type Var = {
  startAt: number;
  userId?: string;
  client_id?: string;
  description?: string;
  user?: {
    sub: string;
    azp: string;
    permissions: string[];
  };
  userName?: string;
  // I'm not sure what connection_id actually means here...  In Auth0 we get con_TI7p6dEHf551Q9t6
  // connectionId?: string;
  connection?: string;
  auth0_client?: z.infer<typeof Auth0Client>;
  // TODO - enable these, populate, and use
  //   strategy?: string;
  //   strategyType?: string;
  //   sessionConnection?: string;
  //   audience?: string;
  //   scope?: string;
};
