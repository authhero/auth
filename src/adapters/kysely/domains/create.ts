import { Database } from "../../../types";
import { Kysely } from "kysely";
import { nanoid } from "nanoid";
import { Domain, DomainInsert } from "@authhero/adapter-interfaces";

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
