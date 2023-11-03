import { Database, OTP, SqlOTP } from "../../../types";
import { Kysely } from "kysely";

export function list(db: Kysely<Database>) {
  return async (tenant_id: string, email: string): Promise<OTP[]> => {
    const now = new Date().toISOString();
    const otps = await db
      .selectFrom("otps")
      .where("otps.tenant_id", "=", tenant_id)
      .where("otps.email", "=", email)
      .where("otps.used_at", "=", null)
      .where("otps.expires_at", "<", now)
      .selectAll()
      .execute();

    return otps.map((otp) => {
      const { nonce, state, scope, response_type, redirect_uri, ...rest } = otp;

      return {
        ...rest,
        authParams: {
          nonce,
          state,
          scope,
          response_type,
          redirect_uri,
        },
      };
    });
  };
}
