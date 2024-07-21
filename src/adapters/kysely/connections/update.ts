import { Kysely } from "kysely";
import { Database } from "../../../types";
import { ConnectionInsert } from "@authhero/adapter-interfaces";

export function update(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    connection_id: string,
    connection: Partial<ConnectionInsert>,
  ): Promise<boolean> => {
    const sqlConnection = {
      ...connection,
      updated_at: new Date().toISOString(),
    };

    await db
      .updateTable("connections")
      .set(sqlConnection)
      .where("connections.id", "=", connection_id)
      .where("connections.tenant_id", "=", tenant_id)
      .execute();

    return true;
  };
}
