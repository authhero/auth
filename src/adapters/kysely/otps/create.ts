import { OTP, OTPInsert } from "@authhero/adapter-interfaces";
import { Database } from "../../../types";
import { Kysely } from "kysely";

export function create(db: Kysely<Database>) {
  return async (tenant_id: string, otp: OTPInsert) => {
    const { authParams, ...rest } = otp;

    await db
      .insertInto("otps")
      .values({
        ...rest,
        ...authParams,
        created_at: new Date().toISOString(),
        tenant_id,
        // TODO: this will be fixed in next version of the adapter
        send: otp.send === "code" ? "code" : "link",
      })
      .execute();
  };
}
