import { Controller } from "@tsoa/runtime";
import { nanoid } from "nanoid";
import { Env, AuthParams, Profile, AuthorizationResponseType } from "../types";

import { generateAuthResponse } from "../helpers/generate-auth-response";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";
import { applyTokenResponse } from "../helpers/apply-token-response";

export async function ticketAuth(
  env: Env,
  tenant_id: string,
  controller: Controller,
  ticketId: string,
  authParams: AuthParams,
) {
  const ticket = await env.data.tickets.get(tenant_id, ticketId);
  if (!ticket) {
    throw new Error("Ticket not found");
  }

  let user = await env.data.users.getByEmail(tenant_id, ticket.email);

  if (!user) {
    user = await env.data.users.create(tenant_id, {
      id: `email|${nanoid()}`,
      email: ticket.email,
      name: ticket.email,
      tenant_id,
    });
  }

  const sessionId = await setSilentAuthCookies(
    env,
    controller,
    ticket.tenant_id,
    ticket.client_id,
    user,
  );

  const tokenResponse = await generateAuthResponse({
    env,
    // userId: user.id,
    // should this be called sub?
    userId: `${tenant_id}|${nanoid()}`,
    state: authParams.state,
    authParams: {
      ...authParams,
      scope: ticket.authParams?.scope,
    },
    sid: sessionId,
    user,
    responseType: authParams.response_type || AuthorizationResponseType.TOKEN,
  });

  return applyTokenResponse(controller, tokenResponse, authParams);
}
