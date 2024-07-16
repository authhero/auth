import { Kysely } from "kysely";
import { Database } from "../../../types";
import { removeNullProperties } from "../helpers/remove-nulls";
import { Application } from "../../../types/Application";

export function get(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    application_id: string,
  ): Promise<Application | null> => {
    const application = await db
      .selectFrom("applications")
      .where("applications.tenant_id", "=", tenant_id)
      .where("applications.id", "=", application_id)
      .executeTakeFirst();

    if (!application) {
      return null;
    }

    // @ts-ignore
    application.disable_sign_ups = application.disable_sign_ups === 1;

    return removeNullProperties(application);
  };
}
