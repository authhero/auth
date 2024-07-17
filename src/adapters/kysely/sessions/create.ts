import { Database } from "../../../types";
import { Kysely } from "kysely";
import { Session, SessionInsert } from "@authhero/adapter-interfaces";

export function create(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    session: SessionInsert,
  ): Promise<Session> => {
    // TODO: Update the column names to match the sesion entity
    const createdSession = {
      user_id: session.user_id,
      client_id: session.client_id,
      created_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
      used_at: session.used_at,
    };

    await db
      .insertInto("sessions")
      .values({ ...createdSession, tenant_id, id: session.session_id })
      .execute();

    return { ...session, ...createdSession };
  };
}
