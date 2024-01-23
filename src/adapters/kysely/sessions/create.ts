import { Database, Session, SqlSession } from "../../../types";
import { Kysely } from "kysely";

export function create(db: Kysely<Database>) {
  return async (session: Session) => {
    const sqlSession: SqlSession = {
      id: session.id,
      user_id: session.user_id,
      tenant_id: session.tenant_id,
      client_id: session.client_id,
      created_at: session.created_at.toISOString(),
      expires_at: session.expires_at.toISOString(),
      used_at: session.used_at.toISOString(),
    };

    await db.insertInto("sessions").values(sqlSession).execute();
  };
}
