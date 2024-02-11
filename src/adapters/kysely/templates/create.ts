import { Database, SqlTemplate } from "../../../types";
import { Kysely } from "kysely";

export interface CreateTemplateParams {
  id: string;
  text: string;
}

export function create(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    params: CreateTemplateParams,
  ): Promise<SqlTemplate> => {
    const template: SqlTemplate = {
      tenant_id: tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...params,
    };

    await db.insertInto("templates").values(template).execute();

    return template;
  };
}
