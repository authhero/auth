import { OTP } from "../../../types/OTP";

export function list(otpStorage: OTP[]) {
  return async (tenant_id: string, email: string): Promise<OTP[]> => {
    return otpStorage.filter(
      (otp) => otp.tenant_id === tenant_id && otp.email === email,
    );
  };
}
