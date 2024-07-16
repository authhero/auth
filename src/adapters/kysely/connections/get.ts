import { Kysely } from "kysely";
import { Database } from "../../../types";
import { removeNullProperties } from "../helpers/remove-nulls";
import { Connection } from "../../../types/Connection";

export function get(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    connection_id: string,
  ): Promise<Connection | null> => {
    const connection = await db
      .selectFrom("connections")
      .where("connections.tenant_id", "=", tenant_id)
      .where("connections.id", "=", connection_id)
      .executeTakeFirst();

    if (!connection) {
      return null;
    }

    return removeNullProperties(connection);
  };
}
