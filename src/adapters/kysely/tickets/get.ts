import { Ticket } from "@authhero/adapter-interfaces";
import { Kysely } from "kysely";
import { Database } from "../db";

export function get(db: Kysely<Database>) {
  return async (tenant_id: string, id: string): Promise<Ticket | null> => {
    const ticket = await db
      .selectFrom("tickets")
      .where("tickets.tenant_id", "=", tenant_id)
      .where("tickets.id", "=", id)
      .where("tickets.used_at", "is", null)
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
      created_at: new Date(ticket.created_at),
      expires_at: new Date(ticket.expires_at),
      used_at: ticket.used_at ? new Date(ticket.used_at) : undefined,
    };
  };
}
