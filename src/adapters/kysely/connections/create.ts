import { Database } from "../../../types";
import { Connection, ConnectionInsert } from "../../../types/Connection";
import { Kysely } from "kysely";

export function create(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    params: ConnectionInsert,
  ): Promise<Connection> => {
    const connection = {
      ...params,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id,
    };

    await db.insertInto("connections").values(connection).execute();

    return connection;
  };
}
