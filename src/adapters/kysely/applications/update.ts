import { Kysely } from "kysely";
import { ApplicationInsert } from "@authhero/adapter-interfaces";
import { Database } from "../db";

export function update(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    application_id: string,
    application: Partial<ApplicationInsert>,
  ): Promise<boolean> => {
    const sqlConnection = {
      ...application,
      updated_at: new Date().toISOString(),
    };

    await db
      .updateTable("connections")
      .set(sqlConnection)
      .where("connections.id", "=", application_id)
      .where("connections.tenant_id", "=", tenant_id)
      .execute();

    return true;
  };
}
