import { Controller } from "@tsoa/runtime";
import { Env, AuthParams, AuthorizationResponseType } from "../types";
import userIdGenerate from "../utils/userIdGenerate";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";
import { applyTokenResponse } from "../helpers/apply-token-response";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { Var } from "../types/Var";
import { LogTypes } from "../types";

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
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  tenant_id: string,
  controller: Controller,
  ticketId: string,
  authParams: AuthParams,
  realm: string,
) {
  const { env } = ctx;

  ctx.set("logType", LogTypes.SUCCESS_CROSS_ORIGIN_AUTHENTICATION);
  ctx.set("connection", realm);

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

  // this will trigger on the code and password flows BUT shouldn't the code accounts be validated as they've signed in?
  // Maybe this is where we should set email_verified to true!
  // we could do this check in a few places...
  if (realm === "Username-Password-Authentication" && !user?.email_verified) {
    // TBD - should this page be on login2 like the expired code one? we're already adding a few universal auth pages...
    // BUT this route will be more frequently used so we probably want the styling totally matching
    return "Email address not verified. We have sent a validation email to your address. Please click the link in the email to continue.";
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

    // TODO - set logging identity provider here

    if (primaryUser) {
      user = primaryUser;
    }
  }

  ctx.set("userId", user.id);
  ctx.set("userName", user.name || user.email);

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
