import { Controller } from "@tsoa/runtime";
import { State } from "../models";
import { Context } from "cloudworker-router";
import { Env, AuthParams } from "../types";
import { headers } from "../constants";
import { base64ToHex } from "../utils/base64";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";

interface PasswordlessState {
  clientId: string;
  username: string;
  userId: string;
  authParams: AuthParams;
}

export async function passwordlessAuth(
  ctx: Context<Env>,
  controller: Controller,
  ticket: string,
  state: string,
  redirectUri: string
) {
  const ticketInstance = ctx.env.stateFactory.getInstanceById(
    base64ToHex(ticket)
  );
  const passwordlessStateString = await ticketInstance.getState.query();

  if (!passwordlessStateString) {
    throw new Error("Ticket not found");
  }

  const passwordlessState: PasswordlessState = JSON.parse(
    passwordlessStateString
  );
  const { userId, authParams } = passwordlessState;

  const tokenResponse = await generateAuthResponse({
    env: ctx.env,
    userId,
    state,
    authParams,
  });

  await setSilentAuthCookies(ctx, controller, userId, authParams);

  const redirectURL = new URL(redirectUri);

  const anchorLinks = new URLSearchParams();

  anchorLinks.set("access_token", tokenResponse.access_token);
  if (tokenResponse.id_token) {
    anchorLinks.set("id_token", tokenResponse.id_token);
  }
  anchorLinks.set("token_type", "Bearer");
  anchorLinks.set("expires_in", "28800");
  anchorLinks.set("state", state);
  if (authParams.scope) {
    anchorLinks.set("scope", authParams.scope);
  }

  redirectURL.hash = anchorLinks.toString();

  controller.setStatus(302);
  controller.setHeader(headers.location, redirectURL.href);
  return "Redirecting";
}
