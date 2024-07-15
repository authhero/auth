import { Env, AuthParams, AuthorizationResponseType } from "../types";
import userIdGenerate from "../utils/userIdGenerate";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { Var } from "../types/Var";
import { LogTypes } from "../types";
import { getPrimaryUserByEmailAndProvider } from "../utils/users";
import { sendEmailVerificationEmail } from "./passwordless";
import { getClient } from "../services/clients";
import { createLogMessage } from "../utils/create-log-message";
import { setSearchParams } from "../utils/url";

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
  ticketId: string,
  authParams: AuthParams,
  realm: string,
) {
  const { env } = ctx;

  ctx.set("connection", realm);

  const ticket = await env.data.tickets.get(tenant_id, ticketId);

  if (!ticket) {
    throw new HTTPException(403, { message: "Ticket not found" });
  }
  ctx.set("client_id", ticket.client_id);

  await env.data.tickets.remove(tenant_id, ticketId);

  const provider = getProviderFromRealm(realm);

  let user = await getPrimaryUserByEmailAndProvider({
    userAdapter: env.data.users,
    tenant_id,
    email: ticket.email,
    provider,
  });

  if (user) {
    ctx.set("userName", user.email);
    ctx.set("connection", user.connection);
    ctx.set("userId", user.user_id);

    if (realm === "Username-Password-Authentication" && !user.email_verified) {
      const client = await getClient(ctx.env, ticket.client_id);

      await sendEmailVerificationEmail({
        env,
        client,
        user,
      });

      // TODO - move this page to auth2 BUT we need to be able to render JSX straight in here... WIP with Markus moving off TSOA
      const login2UniverifiedEmailUrl = new URL(
        `${env.LOGIN2_URL}/unverified-email`,
      );

      const stateDecoded = new URLSearchParams(authParams.state);

      setSearchParams(login2UniverifiedEmailUrl, {
        email: ticket.email,
        lang: client.tenant.language || "sv",
        redirect_uri: stateDecoded.get("redirect_uri"),
        audience: stateDecoded.get("audience"),
        nonce: stateDecoded.get("nonce"),
        scope: stateDecoded.get("scope"),
        response_type: stateDecoded.get("response_type"),
        state: stateDecoded.get("state"),
        client_id: stateDecoded.get("client_id"),
        connection: stateDecoded.get("connection"),
      });

      const log = createLogMessage(ctx, {
        type: LogTypes.FAILED_LOGIN,
        description: "Email not verified",
      });
      await ctx.env.data.logs.create(client.tenant_id, log);

      return new Response("Redirecting", {
        status: 302,
        headers: {
          location: login2UniverifiedEmailUrl.toString(),
        },
      });
    }
  } else {
    if (realm === "Username-Password-Authentication") {
      throw new Error(
        "ticket flow should not arrive here with non existent user - probably the provider is not set on the user",
      );
    }

    user = await env.data.users.create(tenant_id, {
      user_id: `email|${userIdGenerate()}`,
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
    });

    ctx.set("userId", user.user_id);
    ctx.set("userName", user.name || user.email);
  }

  const sessionId = await setSilentAuthCookies(
    env,
    ticket.tenant_id,
    ticket.client_id,
    user,
  );

  return generateAuthResponse({
    ctx,
    state: authParams.state,
    authParams: {
      scope: ticket.authParams?.scope,
      ...authParams,
    },
    sid: sessionId,
    user,
    tenantId: ticket.tenant_id,
    authFlow: "cross-origin",
  });
}
