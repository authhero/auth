import { CreateDomainParams } from "../../interfaces/Domains";
import { Database, SqlDomain } from "../../../types";
import { Kysely } from "kysely";
import {} from "../../../types/Domain";

export function create(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    params: CreateDomainParams,
  ): Promise<SqlDomain> => {
    const domain: SqlDomain = {
      ...params,
    };

    await db.insertInto("domains").values(domain).execute();

    return domain;
  };
}
