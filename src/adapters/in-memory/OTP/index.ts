import { OTPAdapter } from "../../interfaces/OTP";
import { OTP } from "../../../types/OTP";
import { create } from "./create";
import { list } from "./list";

export function createOTPAdapter(): OTPAdapter {
  const otpStorage: OTP[] = [];

  return {
    create: create(otpStorage),
    list: list(otpStorage),
  };
}
