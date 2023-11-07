import { Kysely } from "kysely";
import bcrypt from "bcryptjs";
import { Database, PasswordParams, PasswordResponse } from "../../../types";

export function validate(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    params: PasswordParams,
  ): Promise<PasswordResponse> => {
    const password = await db
      .selectFrom("passwords")
      .where("passwords.tenant_id", "=", tenant_id)
      .where("passwords.user_id", "=", params.user_id)
      .selectAll()
      .executeTakeFirst();

    if (!password) {
      return {
        valid: false,
        message: "No password exists",
      };
    }

    if (!bcrypt.compareSync(params.password, password.password)) {
      return {
        valid: false,
        message: "No password exists",
      };
    }

    return {
      valid: true,
      message: "",
    };
  };
}
