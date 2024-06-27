import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { AuthParams, Env, Var } from "../types";
import { UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS } from "../constants";
import { nanoid } from "nanoid";
import { UniversalLoginSession } from "../adapters/interfaces/UniversalLoginSession";
import { getClient } from "../services/clients";

interface UniversalAuthParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  authParams: AuthParams;
  auth0Client?: string;
}

export async function universalAuth({
  ctx,
  authParams,
  auth0Client,
}: UniversalAuthParams) {
  const client = await getClient(ctx.env, authParams.client_id);

  if (!client) {
    throw new HTTPException(400, { message: "Client not found" });
  }

  const session: UniversalLoginSession = {
    id: nanoid(),
    tenant_id: client.tenant_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(
      Date.now() + UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS * 1000,
    ).toISOString(),
    authParams,
    auth0Client,
  };

  await ctx.env.data.universalLoginSessions.create(session);

  return ctx.redirect(`/u/code?state=${session.id}`);
}
