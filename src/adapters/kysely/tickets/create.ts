import { Ticket } from "@authhero/adapter-interfaces";
import { Database, SqlTicket } from "../../../types";
import { Kysely } from "kysely";

export function create(db: Kysely<Database>) {
  return async (ticket: Ticket) => {
    const { authParams, ...rest } = ticket;

    const sqlTicket: SqlTicket = {
      ...rest,
      ...authParams,
      created_at: ticket.created_at.toISOString(),
      expires_at: ticket.expires_at.toISOString(),
      used_at: ticket.used_at ? ticket.used_at.toISOString() : undefined,
    };

    await db.insertInto("tickets").values(sqlTicket).execute();
  };
}
