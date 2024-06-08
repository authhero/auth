import { Kysely } from "kysely";
import { Database, SqlUser, User } from "../../../types";
import { HTTPException } from "hono/http-exception";

export function create(db: Kysely<Database>) {
  return async (tenantId: string, user: User): Promise<User> => {
    const sqlUser: SqlUser = {
      ...user,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: tenantId,
      email_verified: user.email_verified ? 1 : 0,
      is_social: user.is_social ? 1 : 0,
    };

    try {
      await db.insertInto("users").values(sqlUser).execute();
    } catch (err: any) {
      if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        throw new HTTPException(409, { message: "User already exists" });
      }
      throw new HTTPException(500, { message: err.code });
    }

    return {
      ...sqlUser,
      // TODO: check if this is correct. Should it be optional?
      email: sqlUser.email || "",
      email_verified: sqlUser.email_verified === 1,
      is_social: sqlUser.is_social === 1,
    };
  };
}
