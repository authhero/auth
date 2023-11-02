import { OTP } from "../../types/OTP";

export interface OTPAdapter {
  create: (authCode: OTP) => Promise<void>;
  list: (tenant_id: string, email: string) => Promise<OTP[]>;
}
