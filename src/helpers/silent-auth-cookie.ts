import { Context } from "cloudworker-router";
import { serializeStateInCookie } from "../services/cookies";
import { Controller } from "tsoa";
import { headers, MONTH_IN_SECONDS } from "../constants";
import { AuthParams, Env } from "../types";
import { hexToBase64 } from "../utils/base64";

export async function setSilentAuthCookies(
  ctx: Context<Env>,
  controller: Controller,
  userId: string,
  authParams: AuthParams
) {
  const payload = {
    userId,
    authParams,
  };

  const stateId = ctx.env.STATE.newUniqueId().toString();
  const stateInstance = ctx.env.stateFactory.getInstanceById(stateId);
  stateInstance.createState.mutate({
    state: JSON.stringify(payload),
    ttl: MONTH_IN_SECONDS,
  });

  serializeStateInCookie(hexToBase64(stateId)).forEach((cookie) => {
    controller.setHeader(headers.setCookie, cookie);
  });
}
