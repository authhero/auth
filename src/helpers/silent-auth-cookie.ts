import { Context } from "cloudworker-router";
import { serializeStateInCookie } from "../services/cookies";
import { Controller } from "tsoa";
import { BEARER, headers, MONTH_IN_SECONDS } from "../constants";
import { createState } from "../models";
import { Env } from "../types";
import { hexToBase64 } from "../utils/base64";

export async function setSilentAuthCookies(
  ctx: Context<Env>,
  controller: Controller,
  userId: string,
  scope?: string
) {
  const payload = {
    userId,
    scope,
    expires_in: 28800,
    token_type: BEARER,
  };

  const { id: stateId } = await createState(
    ctx.env.STATE,
    JSON.stringify(payload),
    MONTH_IN_SECONDS
  );

  serializeStateInCookie(hexToBase64(stateId)).forEach((cookie) => {
    controller.setHeader(headers.setCookie, cookie);
  });
}
