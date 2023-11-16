import { Code } from "../../../types/Code";

export function list(codeStorage: Code[]) {
  return async (tenant_id: string, email: string): Promise<Code[]> => {
    return codeStorage.filter(
      (otp) => otp.tenant_id === tenant_id && otp.email === email,
    );
  };
}
