import { PostUsersBody } from "@authhero/adapter-interfaces";
import { Kysely } from "kysely";
import { Database } from "../db";
import { SqlUser } from "./SqlUser";

function getEmailVerified(user: Partial<PostUsersBody>): number | undefined {
  if (user.email_verified === undefined) {
    return undefined;
  }

  return user.email_verified ? 1 : 0;
}

export function update(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    user_id: string,
    user: Partial<PostUsersBody>,
  ): Promise<boolean> => {
    const sqlUser: Partial<SqlUser> = {
      ...user,
      email_verified: getEmailVerified(user),
      updated_at: new Date().toISOString(),
    };

    const results = await db
      .updateTable("users")
      .set(sqlUser)
      .where("users.tenant_id", "=", tenant_id)
      .where("users.user_id", "=", user_id)
      .execute();

    return results.length === 1;
  };
}
