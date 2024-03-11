import { Code } from "../../types/Code";

export interface CodesAdapter {
  create: (tenant_id: string, authCode: Code) => Promise<void>;
  list: (tenant_id: string, user_id: string) => Promise<Code[]>;
}
