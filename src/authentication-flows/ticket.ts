import { Controller } from "@tsoa/runtime";
import { nanoid } from "nanoid";
import { Env, AuthParams, AuthorizationResponseType } from "../types";
import userIdGenerate from "../utils/userIdGenerate";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";
import { applyTokenResponse } from "../helpers/apply-token-response";
import { HTTPException } from "hono/http-exception";
import { User } from "../types/User";

export async function ticketAuth(
  env: Env,
  tenant_id: string,
  controller: Controller,
  ticketId: string,
  authParams: AuthParams,
) {
  const ticket = await env.data.tickets.get(tenant_id, ticketId);
  if (!ticket) {
    throw new HTTPException(403, { message: "Ticket not found" });
  }

  // TODO - filter for primary user
  const usersWithSameEmail = await env.data.users.getByEmail(
    tenant_id,
    ticket.email,
  );

  // hmmmm, but we have no idea if we're on a code or password flow here... need to do to the other ticket first...

  let user: User;

  if (!user) {
    user = await env.data.users.create(tenant_id, {
      id: `email|${userIdGenerate()}`,
      email: ticket.email,
      name: ticket.email,
      tenant_id,
      provider: "email",
      connection: "email",
      email_verified: true,
      login_count: 1,
      is_social: false,
      last_ip: "",
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
    userId: user.id,
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
