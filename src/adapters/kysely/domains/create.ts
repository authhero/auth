import { Database } from "../../../types";
import { Kysely } from "kysely";
import { Domain, DomainInsert } from "../../../types/Domain";
import { nanoid } from "nanoid";

export function create(db: Kysely<Database>) {
  return async (tenant_id: string, params: DomainInsert): Promise<Domain> => {
    const domain = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id,
      id: nanoid(),
      ...params,
    };

    await db.insertInto("domains").values(domain).execute();

    return domain;
  };
}
