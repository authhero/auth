import { Env, Var } from "../types";
import { getClient } from "../services/clients";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import {
  AuthParams,
  ClientCredentialsGrantTypeParams,
} from "@authhero/adapter-interfaces";

export async function clientCredentialsGrant(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  params: ClientCredentialsGrantTypeParams,
) {
  const client = await getClient(ctx.env, params.client_id);
  ctx.set("client_id", client.id);
  ctx.set("tenant_id", client.tenant_id);

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
    client,
    authParams,
  });
}
