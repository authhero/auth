import { Kysely } from "kysely";
import bcrypt from "bcryptjs";
import validatePassword from "../../../utils/validatePassword";
import i18next from "i18next";
import { Database } from "../db";
import { PasswordParams } from "@authhero/adapter-interfaces";

export function create(db: Kysely<Database>) {
  return async (tenant_id: string, params: PasswordParams) => {
    // TODO: move this to a hook
    if (!validatePassword(params.password)) {
      throw new Error(i18next.t("create_account_weak_password"));
    }

    const passwordHash = bcrypt.hashSync(params.password, 10);

    await db
      .insertInto("passwords")
      .values({
        tenant_id,
        user_id: params.user_id,
        password: passwordHash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .execute();
  };
}
