import { z } from "zod";
import { Database } from "../../../types";
import { connectionSchema } from "../../../types/Connection";
import { Kysely } from "kysely";

export function list(db: Kysely<Database>) {
  return async (tenantId: string) => {
    let query = db
      .selectFrom("connections")
      .where("connections.tenant_id", "=", tenantId);

    const connections = z
      .array(connectionSchema)
      .parse(await query.selectAll().execute());

    return connections;
  };
}
