import { CreateConnectionParams } from "../../interfaces/Connections";
import { SqlConnection, Database } from "../../../types";
import { Kysely } from "kysely";

export function create(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    params: CreateConnectionParams,
  ): Promise<SqlConnection> => {
    const connection: SqlConnection = {
      // inconsistency - some adapters add these fields, others already receive them...
      //   created_at: new Date().toISOString(),
      //   updated_at: new Date().toISOString(),
      tenant_id,
      ...params,
    };

    await db.insertInto("connections").values(connection).execute();

    return connection;
  };
}
