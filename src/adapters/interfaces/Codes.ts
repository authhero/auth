import { Code } from "../../types/Code";

export interface CodesAdapter {
  create: (tenant_id: string, authCode: Code) => Promise<void>;
  list: (tenant_id: string, email: string) => Promise<Code[]>;
}
