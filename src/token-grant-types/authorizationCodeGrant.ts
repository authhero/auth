import {
  AuthorizationCodeGrantTypeParams,
  AuthorizationResponseType,
  AuthParams,
  Env,
  User,
  Var,
} from "../types";
import { getClient } from "../services/clients";
import hash from "../utils/hash";
import { stateDecode } from "../utils/stateEncode";
import { HTTPException } from "hono/http-exception";
import { generateAuthResponse } from "../helpers/generate-auth-response-new";
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

  // Check the secret if this is a code grant flow
  const secretHash = await hash(params.client_secret);
  if (client.client_secret !== secretHash) {
    throw new HTTPException(403, { message: "Invalid Secret" });
  }

  return generateAuthResponse(ctx, {
    ...state,
    responseType: AuthorizationResponseType.TOKEN_ID_TOKEN,
  });
}
