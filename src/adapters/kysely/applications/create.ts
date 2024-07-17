import { Kysely } from "kysely";
import { Database } from "../../../types";
import {
  Application,
  CreateApplicationParams,
} from "@authhero/adapter-interfaces";

export function create(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    params: CreateApplicationParams,
  ): Promise<Application> => {
    const application: any = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...params,
      disable_sign_ups: params.disable_sign_ups ? 1 : 0,
    };

    await db
      .insertInto("applications")
      .values({ ...application, tenant_id })
      .execute();

    return application;
  };
}
