import { nanoid } from "nanoid";
import { MONTH_IN_SECONDS } from "../constants";
import { Env, User } from "../types";
import { SessionInsert } from "@authhero/adapter-interfaces";

export async function setSilentAuthCookies(
  env: Env,
  tenant_id: string,
  client_id: string,
  user: User,
) {
  const session: SessionInsert = {
    session_id: nanoid(),
    user_id: user.user_id,
    client_id,
    expires_at: new Date(Date.now() + MONTH_IN_SECONDS * 1000).toISOString(),
    used_at: new Date().toISOString(),
  };

  await env.data.sessions.create(tenant_id, session);

  return session.session_id;
}
