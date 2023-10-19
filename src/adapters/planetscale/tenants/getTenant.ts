import { Database, Tenant } from "../../../types";
import { Kysely } from "kysely";

export function getTenant(db: Kysely<Database>) {
  return async (id: string): Promise<Tenant | undefined> => {
    return db
      .selectFrom("tenants")
      .where("tenants.id", "=", id)
      .selectAll()
      .executeTakeFirst();
  };
}
