import { serializeStateInCookie } from "../services/cookies";
import { Controller } from "tsoa";
import { headers, MONTH_IN_SECONDS } from "../constants";
import { AuthParams, Env, Profile } from "../types";
import { hexToBase64 } from "../utils/base64";

export async function setSilentAuthCookies(
  env: Env,
  controller: Controller,
  user: Profile,
  authParams: AuthParams,
) {
  const payload = {
    userId: user.id,
    user,
    authParams,
  };

  const stateId = env.STATE.newUniqueId().toString();
  const stateInstance = env.stateFactory.getInstanceById(stateId);
  await stateInstance.createState.mutate({
    state: JSON.stringify(payload),
    ttl: MONTH_IN_SECONDS,
  });

  const sessionId = hexToBase64(stateId);

  // This should probably be done outside
  serializeStateInCookie(sessionId).forEach((cookie) => {
    controller.setHeader(headers.setCookie, cookie);
  });

  return sessionId;
}
