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

    Object.keys(sqlUser).forEach((key) => {
      const data = sqlUser as any;
      if (typeof data[key] === "boolean") {
        data[key] = data[key] ? 1 : 0;
      }
      // data.linked_to = null;
    });

    await db.insertInto("users").values(sqlUser).execute();

    return sqlUser;
  };
}
