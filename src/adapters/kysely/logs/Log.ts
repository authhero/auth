import { LogType } from "../../../types/auth0";

export interface SqlLog {
  id: string;
  tenant_id: string;
  type: LogType;
  date: string;
  description?: string;
  ip: string;
  user_agent: string;
  details?: string;
  auth0_client?: string;
  isMobile?: number;
  user_id?: string;
  user_name?: string;
  connection?: string;
  connection_id?: string;
  client_id?: string;
  client_name?: string;
  audience?: string;
  scope?: string;
  strategy?: string;
  strategy_type?: string;
  hostname?: string;
  session_connection?: string;
}
