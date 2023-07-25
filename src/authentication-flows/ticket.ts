import { Controller } from "@tsoa/runtime";
import { Env, AuthParams, AuthorizationResponseType } from "../types";

import { base64ToHex } from "../utils/base64";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";
import { applyTokenResponse } from "../helpers/apply-token-response";

interface PasswordlessState {
  clientId: string;
  username: string;
  userId: string;
  authParams: AuthParams;
}

export async function ticketAuth(
  env: Env,
  controller: Controller,
  ticket: string,
  state: string,
  redirectUri: string,
  responseType: AuthorizationResponseType,
) {
  const ticketInstance = env.stateFactory.getInstanceById(base64ToHex(ticket));

  const ticketString = await ticketInstance.getState.query();
  if (!ticketString) {
    throw new Error("Ticket not found");
  }

  const ticketJson: PasswordlessState = JSON.parse(ticketString);
  const { userId, authParams } = ticketJson;

  const user = await env.userFactory.getInstanceByName(userId);
  const profile = await user.getProfile.query();

  const sessionId = await setSilentAuthCookies(
    env,
    controller,
    profile,
    authParams,
  );

  const tokenResponse = await generateAuthResponse({
    env,
    userId,
    state,
    authParams,
    sid: sessionId,
    user: profile,
    responseType,
  });

  return applyTokenResponse(controller, tokenResponse, {
    ...authParams,
    redirect_uri: redirectUri,
    state,
  });
}
