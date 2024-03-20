import { Database, PasswordParams } from "../../../types";
import { Kysely } from "kysely";
import bcrypt from "bcryptjs";
import validatePassword from "../../../utils/validatePassword";

export function create(db: Kysely<Database>) {
  return async (tenant_id: string, params: PasswordParams) => {
    // not sure if should do this in the route or here... seems like in the adapters is safer...
    // BUT should the create/update return false? or throw an error?
    // and if an error, a Hono error?
    // we will do clientside password validation in login2 for signups
    // BUT password resets will rely on this in universal auth - so let's see what happens
    // AND There are some routes we won't use on u/login - so we might not be testing everything
    if (!validatePassword(params.password)) {
      throw new Error("Password does not meet the requirements");
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
