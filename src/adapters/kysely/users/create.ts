import { Kysely } from "kysely";
import { Database, SqlUser, User } from "../../../types";

export function create(db: Kysely<Database>) {
  return async (tenantId: string, user: User): Promise<SqlUser> => {
    const sqlUser: SqlUser = {
      ...user,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: tenantId,
    };

    // I think we should change SQLuser to have email_verified and is_social as integers
    // this is what we are currently writing to planetscale!
    const sqliteUser = {
      ...user,
    } as any;

    Object.keys(sqliteUser).forEach((key) => {
      if (typeof sqliteUser[key] === "boolean") {
        sqliteUser[key] = sqliteUser[key] ? 1 : 0;
      }
    });

    await db.insertInto("users").values(sqliteUser).execute();

    return sqlUser;
  };
}
