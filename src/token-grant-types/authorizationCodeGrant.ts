import {
  AuthorizationCodeGrantTypeParams,
  AuthorizationResponseType,
  AuthParams,
  Env,
  User,
  Var,
} from "../types";
import { getClient } from "../services/clients";
import { stateDecode } from "../utils/stateEncode";
import { HTTPException } from "hono/http-exception";
import { generateAuthData } from "../helpers/generate-auth-response";
import { Context } from "hono";

export async function authorizeCodeGrant(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  params: AuthorizationCodeGrantTypeParams,
) {
  const state: {
    userId: string;
    authParams: AuthParams;
    user: User;
    sid: string;
  } = stateDecode(params.code); // this "code" is actually a stringified base64 encoded state object...

  if (params.client_id && state.authParams.client_id !== params.client_id) {
    throw new HTTPException(403, { message: "Invalid Client" });
  }

  const client = await getClient(ctx.env, state.authParams.client_id);
  if (!client) {
    throw new HTTPException(400, { message: "Client not found" });
  }

  // TODO: Temporary fix for the default client
  const defaultClient = await getClient(ctx.env, "DEFAULT_CLIENT");

  if (
    client.client_secret !== params.client_secret &&
    defaultClient?.client_secret !== params.client_secret
  ) {
    throw new HTTPException(403, { message: "Invalid Secret" });
  }

  const tokens = generateAuthData({
    ...state,
    env: ctx.env,
    tenantId: client.tenant_id,
    responseType: AuthorizationResponseType.TOKEN_ID_TOKEN,
  });
  return ctx.json(tokens);
}
