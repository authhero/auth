import { Kysely } from "kysely";
import { Database } from "../../../types";
import { removeNullProperties } from "../helpers/remove-nulls";
import { Application } from "@authhero/adapter-interfaces";

export function get(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    application_id: string,
  ): Promise<Application | null> => {
    const application = await db
      .selectFrom("applications")
      .where("applications.tenant_id", "=", tenant_id)
      .where("applications.id", "=", application_id)
      .selectAll()
      .executeTakeFirst();

    if (!application) {
      return null;
    }

    application.disable_sign_ups = !!application.disable_sign_ups;

    return removeNullProperties(application);
  };
}
