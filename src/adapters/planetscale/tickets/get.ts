import { Database, Ticket } from "../../../types";
import { Kysely } from "kysely";

export function get(db: Kysely<Database>) {
  return async (tenant_id: string, id: string): Promise<Ticket | null> => {
    const ticket = await db
      .selectFrom("tickets")
      .where("tickets.tenant_id", "=", tenant_id)
      .where("tickets.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!ticket) {
      return null;
    }

    const {
      nonce,
      state,
      scope,
      response_type,
      response_mode,
      redirect_uri,
      ...rest
    } = ticket;

    return {
      ...rest,
      authParams: {
        nonce,
        state,
        scope,
        response_type,
        response_mode,
        redirect_uri,
      },
    };
  };
}
