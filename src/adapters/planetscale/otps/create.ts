import { Database, OTP } from "../../../types";
import { Kysely } from "kysely";

export function create(db: Kysely<Database>) {
  return async (otp: OTP) => {
    const { authParams, ...rest } = otp;

    await db
      .insertInto("otps")
      .values({
        ...rest,
        ...authParams,
        created_at: rest.created_at.toISOString(),
        expires_at: rest.expires_at.toISOString(),
      })
      .execute();
  };
}
