import { OTP } from "@authhero/adapter-interfaces";
import { Database } from "../../../types";
import { Kysely } from "kysely";

export function list(db: Kysely<Database>) {
  return async (tenant_id: string, email: string): Promise<OTP[]> => {
    const now = new Date().toISOString();

    const otps = await db
      .selectFrom("otps")
      .where("otps.tenant_id", "=", tenant_id)
      .where("otps.email", "=", email)
      .where("otps.expires_at", ">", now)
      .where("otps.used_at", "is", null)
      .selectAll()
      .execute();

    return otps.map((otp) => {
      const {
        nonce,
        state,
        scope,
        response_type,
        redirect_uri,
        client_id,
        ...rest
      } = otp;

      return {
        ...rest,
        // TODO: this will be removed in the next version of the adapter
        client_id,
        authParams: {
          client_id,
          nonce,
          state,
          scope,
          response_type,
          redirect_uri,
        },
        created_at: otp.created_at,
        expires_at: otp.expires_at,
      };
    });
  };
}
