import { Database, Session } from "../../../types";
import { Kysely } from "kysely";

export function create(db: Kysely<Database>) {
  return async (session: Session) => {
    await db.insertInto("sessions").values(session).execute();
  };
}
