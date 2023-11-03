import { Database, Ticket } from "../../../types";
import { Kysely } from "kysely";

export function get(db: Kysely<Database>) {
  return async (id: string): Promise<Ticket | null> => {
    const session = await db
      .selectFrom("tickets")
      .where("tickets.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!session) {
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
    } = session;

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
