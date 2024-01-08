import { Controller } from "@tsoa/runtime";
import { nanoid } from "nanoid";
import { Env, AuthParams, AuthorizationResponseType } from "../types";
import userIdGenerate from "../utils/userIdGenerate";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";
import { applyTokenResponse } from "../helpers/apply-token-response";
import { HTTPException } from "hono/http-exception";
import { User } from "../types/User";

function getProviderFromRealm(realm: string) {
  if (realm === "Username-Password-Authentication") {
    return "auth2";
  }

  if (realm === "email") {
    return "email";
  }

  throw new HTTPException(403, { message: "Invalid realm" });
}

export async function ticketAuth(
  env: Env,
  tenant_id: string,
  controller: Controller,
  ticketId: string,
  authParams: AuthParams,
  realm: string,
) {
  const ticket = await env.data.tickets.get(tenant_id, ticketId);
  if (!ticket) {
    throw new HTTPException(403, { message: "Ticket not found" });
  }

  const provider = getProviderFromRealm(realm);

  const usersWithSameEmail = await env.data.users.getByEmail(
    tenant_id,
    ticket.email,
  );

  let user = usersWithSameEmail.find((u) => u.provider === provider) || null;

  if (user?.linked_to) {
    user = await env.data.users.get(tenant_id, user.linked_to);
  }

  if (!user) {
    if (realm === "Username-Password-Authentication") {
      throw new Error(
        "ticket flow should not arrive here with non existent user - probably the provider is not set on the user",
      );
    }

    const primaryUser = usersWithSameEmail.find((u) => !u.linked_to);

    const linkedTo = primaryUser?.id;

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
      linked_to: linkedTo,
    });

    if (primaryUser) {
      user = primaryUser;
    }
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
