import { Code } from "../Code";

export interface SqlCode extends Code {
  tenant_id: string;
}
