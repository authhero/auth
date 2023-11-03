import { Database, Ticket } from "../../../types";
import { Kysely } from "kysely";

export function create(db: Kysely<Database>) {
  return async (ticket: Ticket) => {
    const { authParams, ...rest } = ticket;
    await db
      .insertInto("tickets")
      .values({ ...rest, ...authParams })
      .execute();
  };
}
