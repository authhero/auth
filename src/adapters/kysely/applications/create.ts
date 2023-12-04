import { Kysely } from "kysely";
import { Application, Database } from "../../../types";
import { CreateApplicationParams } from "../../interfaces/Applications";

export function create(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    params: CreateApplicationParams,
  ): Promise<Application> => {
    const application: Application = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id,
      ...params,
    };

    await db.insertInto("applications").values(application).execute();

    return application;
  };
}
