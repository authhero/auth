import { Code, SqlCode } from "../../../types";

export function list(codeStorage: SqlCode[]) {
  return async (tenant_id: string, email: string): Promise<Code[]> => {
    return codeStorage.filter(
      (code) => code.tenant_id === tenant_id && code.email === email,
    );
  };
}
