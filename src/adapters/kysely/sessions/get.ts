import { Database, Session } from "../../../types";
import { Kysely } from "kysely";

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
      id: sqlSession.id,
      user_id: sqlSession.user_id,
      tenant_id: sqlSession.tenant_id,
      client_id: sqlSession.client_id,
      created_at: new Date(sqlSession.created_at),
      expires_at: new Date(sqlSession.expires_at),
      used_at: new Date(sqlSession.used_at),
    };

    return session;
  };
}
