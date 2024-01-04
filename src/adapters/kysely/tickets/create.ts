import { Database, Ticket } from "../../../types";
import { Kysely } from "kysely";
import { SqlTicket } from "../../../types/sql/Ticket";

export function create(db: Kysely<Database>) {
  return async (ticket: Ticket) => {
    const { authParams, ...rest } = ticket;

    const sqlTicket: SqlTicket = {
      ...rest,
      ...authParams,
      created_at: ticket.created_at.toISOString(),
      expires_at: ticket.expires_at.toISOString(),
    };

    await db.insertInto("tickets").values(sqlTicket).execute();
  };
}
