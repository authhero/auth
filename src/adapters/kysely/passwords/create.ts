import { Database, PasswordParams } from "../../../types";
import { Kysely } from "kysely";
import bcrypt from "bcryptjs";

export function create(db: Kysely<Database>) {
  return async (tenant_id: string, params: PasswordParams) => {
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
