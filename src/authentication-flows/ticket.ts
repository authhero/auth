import { Controller } from "@tsoa/runtime";
import {
  Env,
  AuthParams,
  AuthorizationResponseType,
  Profile,
  AuthorizationResponseMode,
} from "../types";

import { generateAuthResponse } from "../helpers/generate-auth-response";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";
import { applyTokenResponse } from "../helpers/apply-token-response";
import { client } from "test/fixtures";

export async function ticketAuth(
  env: Env,
  tenant_id: string,
  controller: Controller,
  ticketId: string,
  state: string,
  redirectUri: string,
  responseType: AuthorizationResponseType,
) {
  const ticket = await env.data.tickets.get(tenant_id, ticketId);
  if (!ticket) {
    throw new Error("Ticket not found");
  }

  let user = await env.data.users.getByEmail(tenant_id, ticket.email);

  if (!user) {
    user = await env.data.users.create(tenant_id, {
      id: `${tenant_id}|${ticket.email}`,
      email: ticket.email,
      name: ticket.email,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  // TODO: Fallback to old profile
  const profile: Profile = {
    id: user.id,
    email: user.email,
    name: user.name,
    nickname: user.nickname,
    picture: user.picture,
    created_at: user.created_at,
    updated_at: user.updated_at,
    tenant_id: user.tenant_id,
    connections: [],
  };

  const authParams: AuthParams = {
    response_mode: AuthorizationResponseMode.QUERY,
    ...ticket.authParams,
    client_id: ticket.client_id,
  };

  const sessionId = await setSilentAuthCookies(
    env,
    controller,
    ticket.tenant_id,
    ticket.client_id,
    profile,
    authParams,
  );

  const tokenResponse = await generateAuthResponse({
    env,
    userId: user.user_id,
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
