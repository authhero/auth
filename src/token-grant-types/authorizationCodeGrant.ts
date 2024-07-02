import {
  AuthorizationCodeGrantTypeParams,
  AuthorizationResponseType,
  Env,
  Var,
} from "../types";
import { getClient } from "../services/clients";
import { HTTPException } from "hono/http-exception";
import { generateAuthData } from "../helpers/generate-auth-response";
import { Context } from "hono";
import { nanoid } from "nanoid";
import { createLogMessage } from "../utils/create-log-message";

export async function authorizeCodeGrant(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  params: AuthorizationCodeGrantTypeParams,
) {
  const client = await getClient(ctx.env, params.client_id);
  if (!client) {
    throw new HTTPException(400, { message: "Client not found" });
  }

  // TODO: this does not set the used_at attribute
  const { user_id, nonce, authParams, used_at, expires_at } =
    await ctx.env.data.authenticationCodes.get(client.tenant_id, params.code);

  if (used_at || new Date(expires_at) < new Date()) {
    throw new HTTPException(400, { message: "Code not found or expired" });
  }

  const user = await ctx.env.data.users.get(client.tenant_id, user_id);
  if (!user) {
    throw new HTTPException(400, { message: "User not found" });
  }

  // TODO: Temporary fix for the default client
  const defaultClient = await getClient(ctx.env, "DEFAULT_CLIENT");

  if (
    client.client_secret !== params.client_secret &&
    defaultClient?.client_secret !== params.client_secret
  ) {
    throw new HTTPException(403, { message: "Invalid Secret" });
  }

  const tokens = await generateAuthData({
    userId: user_id,
    authParams,
    nonce,
    user,
    sid: nanoid(),
    responseType: AuthorizationResponseType.TOKEN_ID_TOKEN,
    env: ctx.env,
    tenantId: client.tenant_id,
  });

  ctx.set("userName", user.email);
  ctx.set("connection", user.connection);
  ctx.set("client_id", client.id);
  const log = createLogMessage(
    ctx,
    "seacft",
    "Authorization Code for Access Token",
  );

  await ctx.env.data.logs.create(client.tenant_id, log);

  return ctx.json(tokens);
}
