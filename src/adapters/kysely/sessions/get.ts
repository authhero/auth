import { Session } from "@authhero/adapter-interfaces";
import { Kysely } from "kysely";
import { Database } from "../db";

export function get(db: Kysely<Database>) {
  return async (tenant_id: string, id: string): Promise<Session | null> => {
    const sqlSession = await db
      .selectFrom("sessions")
      .where("sessions.tenant_id", "=", tenant_id)
      .where("sessions.id", "=", id)
      .where("sessions.deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!sqlSession) return null;

    const session: Session = {
      session_id: sqlSession.id,
      user_id: sqlSession.user_id,
      client_id: sqlSession.client_id,
      created_at: sqlSession.created_at,
      expires_at: sqlSession.expires_at,
      used_at: sqlSession.used_at,
    };

    return session;
  };
}
