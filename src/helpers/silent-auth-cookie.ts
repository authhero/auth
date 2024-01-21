import { nanoid } from "nanoid";
import { serializeStateInCookie } from "../services/cookies";
import { Controller } from "tsoa";
import { headers, MONTH_IN_SECONDS } from "../constants";
import { Env, User, Session } from "../types";

export async function setSilentAuthCookies(
  env: Env,
  controller: Controller,
  tenant_id: string,
  client_id: string,
  user: User,
) {
  const session: Session = {
    id: nanoid(),
    user_id: user.id,
    tenant_id,
    client_id,
    created_at: new Date(),
    expires_at: new Date(Date.now() + MONTH_IN_SECONDS * 1000),
  };

  await env.data.sessions.create(session);

  // This should probably be done outside
  serializeStateInCookie(session.id).forEach((cookie) => {
    controller.setHeader(headers.setCookie, cookie);
  });

  return session.id;
}
