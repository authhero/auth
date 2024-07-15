import { nanoid } from "nanoid";
import { MONTH_IN_SECONDS } from "../constants";
import { Env, User, Session } from "../types";

export async function setSilentAuthCookies(
  env: Env,
  tenant_id: string,
  client_id: string,
  user: User,
) {
  const session: Session = {
    id: nanoid(),
    user_id: user.user_id,
    tenant_id,
    client_id,
    created_at: new Date(),
    expires_at: new Date(Date.now() + MONTH_IN_SECONDS * 1000),
    used_at: new Date(),
  };

  await env.data.sessions.create(session);

  return session.id;
}
