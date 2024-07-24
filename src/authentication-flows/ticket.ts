import { AuthParams, LogTypes } from "@authhero/adapter-interfaces";
import { Env } from "../types";
import userIdGenerate from "../utils/userIdGenerate";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { Var } from "../types/Var";
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
  const client = await getClient(ctx.env, ticket.client_id);
  ctx.set("client_id", ticket.client_id);

  await env.data.tickets.remove(tenant_id, ticketId);

  const provider = getProviderFromRealm(realm);

  let user = await getPrimaryUserByEmailAndProvider({
    userAdapter: env.data.users,
    tenant_id,
    email: ticket.email,
    provider,
  });

  if (!user) {
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
  }

  ctx.set("userName", user.email);
  ctx.set("userId", user.user_id);

  return generateAuthResponse({
    ctx,
    authParams: {
      scope: ticket.authParams?.scope,
      ...authParams,
    },
    user,
    client,
    authFlow: "cross-origin",
  });
}
