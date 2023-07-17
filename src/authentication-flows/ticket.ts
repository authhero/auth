import { Controller } from "@tsoa/runtime";
import { Env, AuthParams, AuthorizationResponseType } from "../types";
import { base64ToHex } from "../utils/base64";
import { generateTokens } from "../helpers/generate-auth-response";
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
) {
  const ticketInstance = env.stateFactory.getInstanceById(base64ToHex(ticket));

  const ticketString = await ticketInstance.getState.query();
  if (!ticketString) {
    throw new Error("Ticket not found");
  }

  const ticketJson: PasswordlessState = JSON.parse(ticketString);
  const { userId, authParams } = ticketJson;

  const tokenResponse = await generateTokens({
    env,
    userId,
    state,
    authParams,
    sid: "sid",
    responseType: AuthorizationResponseType.TOKEN,
  });

  await setSilentAuthCookies(env, controller, userId, authParams);

  return applyTokenResponse(controller, tokenResponse, authParams);
}
