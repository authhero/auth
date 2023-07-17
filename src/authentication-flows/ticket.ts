import { Controller } from "@tsoa/runtime";
import { Env, AuthParams, AuthorizationResponseType } from "../types";
import { headers } from "../constants";
import { base64ToHex } from "../utils/base64";
import {
  generateAuthResponse,
  generateTokens,
} from "../helpers/generate-auth-response";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";

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

  const redirectURL = new URL(redirectUri);

  const anchorLinks = new URLSearchParams();

  anchorLinks.set("access_token", tokenResponse.access_token);
  if (tokenResponse.id_token) {
    anchorLinks.set("id_token", tokenResponse.id_token);
  }
  anchorLinks.set("token_type", "Bearer");
  anchorLinks.set("expires_in", "28800");
  anchorLinks.set("state", encodeURIComponent(state));
  if (authParams.scope) {
    anchorLinks.set("scope", authParams.scope);
  }

  redirectURL.hash = anchorLinks.toString();

  controller.setStatus(302);
  controller.setHeader(headers.location, redirectURL.href);
  return "Redirecting";
}
