import { Database } from "../../../types";
import { Kysely } from "kysely";
import { removeNullProperties } from "../helpers/remove-nulls";
import { Tenant } from "@authhero/adapter-interfaces";

export function getTenant(db: Kysely<Database>) {
  return async (id: string): Promise<Tenant | null> => {
    const tenant = await db
      .selectFrom("tenants")
      .where("tenants.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!tenant) {
      return null;
    }

    return removeNullProperties(tenant);
  };
}
