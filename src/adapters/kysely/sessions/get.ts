import { Database, Session } from "../../../types";
import { Kysely } from "kysely";

export function get(db: Kysely<Database>) {
  return async (id: string): Promise<Session | null> => {
    const session = await db
      .selectFrom("sessions")
      .where("sessions.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    return session || null;
  };
}
