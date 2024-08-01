import { Context } from "hono";
import { Env, Var } from "../types";
import { UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS } from "../constants";
import {
  AuthParams,
  Client,
  Session,
  LoginInsert,
} from "@authhero/adapter-interfaces";
import { generateAuthResponse } from "../helpers/generate-auth-response";

interface UniversalAuthParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  client: Client;
  session?: Session;
  authParams: AuthParams;
  auth0Client?: string;
  login_hint?: string;
}

export async function universalAuth({
  ctx,
  session,
  client,
  authParams,
  auth0Client,
  login_hint,
}: UniversalAuthParams) {
  // Check if the user in the login_hint matches the user in the session
  if (session && login_hint) {
    const user = await ctx.env.data.users.get(
      client.tenant_id,
      session.user_id,
    );

    if (user?.email === login_hint) {
      return generateAuthResponse({
        ctx,
        client,
        sid: session.session_id,
        authParams,
        user,
      });
    }
  }

  const login = await ctx.env.data.logins.create(client.tenant_id, {
    expires_at: new Date(
      Date.now() + UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS * 1000,
    ).toISOString(),
    authParams,
    // TODO: add this back once the schema is updated
    // auth0Client,
  });

  // If there is a sesion we redirect to the check-account page
  if (session) {
    return ctx.redirect(`/u/check-account?state=${login.login_id}`);
  }

  return ctx.redirect(`/u/enter-email?state=${login.login_id}`);
}
