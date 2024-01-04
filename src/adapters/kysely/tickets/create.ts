import { Database, Ticket } from "../../../types";
import { Kysely } from "kysely";

export function create(db: Kysely<Database>) {
  return async (ticket: Ticket) => {
    const { authParams } = ticket;

    const rest = {
      ...ticket,
      created_at: new Date(ticket.created_at).toISOString(),
      expires_at: new Date(ticket.expires_at).toISOString(),
    };
    await db
      .insertInto("tickets")
      .values({ ...rest, ...authParams })
      .execute();
  };
}
