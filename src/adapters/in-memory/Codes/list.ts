import { Code, SqlCode } from "../../../types";

export function list(codeStorage: SqlCode[]) {
  return async (tenant_id: string, email: string): Promise<Code[]> => {
    return codeStorage.filter(
      (otp) => otp.tenant_id === tenant_id && otp.email === email,
    );
  };
}
