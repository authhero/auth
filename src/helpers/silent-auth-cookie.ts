import { nanoid } from "nanoid";
import { serializeStateInCookie } from "../services/cookies";
import { Controller } from "tsoa";
import { headers, MONTH_IN_SECONDS } from "../constants";
import { AuthParams, Env, Profile } from "../types";
import { hexToBase64 } from "../utils/base64";

export async function setSilentAuthCookies(
  env: Env,
  controller: Controller,
  tenant_id: string,
  client_id: string,
  user: Profile,
  authParams: AuthParams,
) {
  const session = {
    id: nanoid(),
    userId: user.id,
    user,
    authParams,
    tenant_id,
    client_id,
    created_at: new Date(),
    expires_at: new Date(MONTH_IN_SECONDS * 1000),
    user_id: user.id,
  };

  await env.data.sessions.create(session);

  // This should probably be done outside
  serializeStateInCookie(session.id).forEach((cookie) => {
    controller.setHeader(headers.setCookie, cookie);
  });

  return session.id;
}
