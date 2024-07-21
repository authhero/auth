import {
  CodeChallengeMethod,
  UniversalLoginSession,
} from "@authhero/adapter-interfaces";
import { Database } from "../../../types";
import { Kysely } from "kysely";

export function get(db: Kysely<Database>) {
  return async (id: string): Promise<UniversalLoginSession | null> => {
    const now = new Date().toISOString();

    const session = await db
      .selectFrom("universal_login_sessions")
      .where("universal_login_sessions.expires_at", ">", now)
      .where("universal_login_sessions.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!session) return null;

    const {
      response_type,
      response_mode,
      redirect_uri,
      audience,
      state,
      nonce,
      scope,
      code_challenge_method,
      code_challenge,
      username,
      vendor_id,
      ...rest
    } = session;

    return {
      ...rest,
      authParams: {
        client_id: rest.client_id,
        vendor_id,
        response_type,
        response_mode,
        redirect_uri,
        audience,
        state,
        nonce,
        scope,
        // @ts-ignore
        code_challenge_method,
        code_challenge,
        username,
      },
    };
  };
}
