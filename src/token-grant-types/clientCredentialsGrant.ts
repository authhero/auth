import {
  ClientCredentialsGrantTypeParams,
  AuthParams,
  Env,
  Var,
} from "../types";
import { getClient } from "../services/clients";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { nanoid } from "nanoid";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";

export async function clientCredentialsGrant(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  params: ClientCredentialsGrantTypeParams,
) {
  const client = await getClient(ctx.env, params.client_id);

  if (client.client_secret !== params.client_secret) {
    throw new HTTPException(403, { message: "Invalid secret" });
  }

  const authParams: AuthParams = {
    client_id: client.id,
    scope: params.scope,
    redirect_uri: "",
  };

  return generateAuthResponse({
    ctx,
    tenant_id: client.tenant_id,
    user: client,
    sid: nanoid(),
    authParams,
  });
}
