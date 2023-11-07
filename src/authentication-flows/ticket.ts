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
      // this isn't what we're doing in the database! we store the ID, and we store the tenant_id
      // id: `${tenant_id}|${nanoid()}`,
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

  const sessionId = await setSilentAuthCookies(
    env,
    controller,
    ticket.tenant_id,
    ticket.client_id,
    profile,
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
    user: profile,
    responseType: authParams.response_type || AuthorizationResponseType.TOKEN,
  });

  return applyTokenResponse(controller, tokenResponse, authParams);
}
