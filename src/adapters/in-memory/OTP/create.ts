import { OTP } from "../../../types/OTP";

export function create(otpStorage: OTP[]) {
  return async (otp: OTP): Promise<void> => {
    otpStorage.push(otp);
  };
}
