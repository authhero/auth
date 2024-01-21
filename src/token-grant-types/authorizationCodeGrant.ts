import {
  AuthorizationCodeGrantTypeParams,
  ClientCredentialGrantTypeParams,
  AuthorizationResponseType,
  AuthParams,
  CodeResponse,
  Env,
  TokenResponse,
  User,
} from "../types";
import { getClient } from "../services/clients";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import hash from "../utils/hash";
import { nanoid } from "nanoid";
import { stateDecode } from "../utils/stateEncode";
import { HTTPException } from "hono/http-exception";

export async function authorizeCodeGrant(
  env: Env,
  params: AuthorizationCodeGrantTypeParams,
): Promise<TokenResponse | CodeResponse> {
  const state: {
    userId: string;
    authParams: AuthParams;
    user: User;
    sid: string;
  } = stateDecode(params.code); // this "code" is actually a stringified base64 encoded state object...

  if (params.client_id && state.authParams.client_id !== params.client_id) {
    throw new HTTPException(403, { message: "Invalid Client" });
  }

  const client = await getClient(env, state.authParams.client_id);
  if (!client) {
    throw new HTTPException(400, { message: "Client not found" });
  }

  // Check the secret if this is a code grant flow
  const secretHash = await hash(params.client_secret);
  if (client.client_secret !== secretHash) {
    throw new HTTPException(403, { message: "Invalid Secret" });
  }

  return generateAuthResponse({
    env,
    ...state,
    responseType: AuthorizationResponseType.TOKEN_ID_TOKEN,
  });
}

export async function clientCredentialsGrant(
  env: Env,
  params: ClientCredentialGrantTypeParams,
): Promise<TokenResponse | CodeResponse> {
  const client = await getClient(env, params.client_id);
  if (!client) {
    throw new HTTPException(400, { message: "Client not found" });
  }

  if (client.client_secret !== params.client_secret) {
    throw new Error("Invalid secret");
  }

  const authParams: AuthParams = {
    client_id: client.id,
    scope: params.scope,
    redirect_uri: "",
  };

  return generateAuthResponse({
    env,
    responseType: AuthorizationResponseType.TOKEN,
    userId: client.id,
    sid: nanoid(),
    authParams,
  });
}
