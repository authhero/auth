import { Context } from "hono";
import { AuthParams, Env, Var } from "../types";
import { UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS } from "../constants";
import { nanoid } from "nanoid";
import {
  Client,
  UniversalLoginSessionInsert,
} from "@authhero/adapter-interfaces";

interface UniversalAuthParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  client: Client;
  authParams: AuthParams;
  auth0Client?: string;
}

export async function universalAuth({
  ctx,
  client,
  authParams,
  auth0Client,
}: UniversalAuthParams) {
  const session: UniversalLoginSessionInsert = {
    id: nanoid(),
    expires_at: new Date(
      Date.now() + UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS * 1000,
    ).toISOString(),
    authParams,
    auth0Client,
  };

  await ctx.env.data.universalLoginSessions.create(client.tenant_id, session);

  return ctx.redirect(`/u/enter-email?state=${session.id}`);
}
