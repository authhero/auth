import { Database, User } from "../../../types";
import { Kysely } from "kysely";

export function getByEmail(db: Kysely<Database>) {
  return async (tenantId: string, email: string): Promise<User[]> => {
    const users = await db
      .selectFrom("users")
      .where("users.tenant_id", "=", tenantId)
      .where("users.email", "=", email)
      .selectAll()
      .execute();

    return users.map((u) => ({
      ...u,
      email_verified: u.email_verified === 1,
      is_social: u.is_social === 1,
    }));
  };
}
