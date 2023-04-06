import { Context } from "cloudworker-router";
import { serializeStateInCookie } from "../services/cookies";
import { Controller } from "tsoa";
import { BEARER, headers, MONTH_IN_SECONDS } from "../constants";
import { State } from "../models";
import { Env } from "../types";
import { hexToBase64 } from "../utils/base64";

export async function setSilentAuthCookies(
  ctx: Context<Env>,
  controller: Controller,
  userId: string,
  scope?: string,
  state?: string
) {
  const payload = {
    userId,
    scope,
    expires_in: 28800,
    token_type: BEARER,
    state,
  };

  const durableObjectId = ctx.env.STATE.newUniqueId();
  const stateInstance = State.getInstance(ctx.env.STATE, durableObjectId);
  await stateInstance.createState.mutate({
    state: JSON.stringify(payload, null, 2),
    ttl: MONTH_IN_SECONDS,
  });

  console.log("DO-id: " + durableObjectId.toString());

  serializeStateInCookie(hexToBase64(durableObjectId.toString())).forEach(
    (cookie) => {
      controller.setHeader(headers.setCookie, cookie);
    }
  );
}
