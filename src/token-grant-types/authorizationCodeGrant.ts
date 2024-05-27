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

export async function authorizeCodeGrant(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  params: AuthorizationCodeGrantTypeParams,
) {
  const client = await getClient(ctx.env, params.client_id);
  if (!client) {
    throw new HTTPException(400, { message: "Client not found" });
  }

  const { user_id, nonce, sid, authParams } =
    await ctx.env.data.authenticationCodes.validate(
      client.tenant_id,
      params.code,
    );

  const user = await ctx.env.data.users.get(authParams.client_id, user_id);
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
    sid,
    responseType: AuthorizationResponseType.TOKEN_ID_TOKEN,
    env: ctx.env,
    tenantId: client.tenant_id,
  });

  return ctx.json(tokens);
}
