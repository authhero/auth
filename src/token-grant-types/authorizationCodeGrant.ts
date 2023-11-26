import { base64ToHex } from "../utils/base64";
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
import { InvalidClientError } from "../errors";
import { getClient } from "../services/clients";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import hash from "../utils/hash";
import { nanoid } from "nanoid";

export async function authorizeCodeGrant(
  env: Env,
  params: AuthorizationCodeGrantTypeParams,
): Promise<TokenResponse | CodeResponse> {
  // Either get the instance based on the id or the code
  const stateInstance = env.stateFactory.getInstanceById(
    base64ToHex(params.code),
  );

  const stateString = await stateInstance.getState.query();
  if (!stateString) {
    throw new Error("State required");
  }

  const state: {
    userId: string;
    authParams: AuthParams;
    user: User;
    sid: string;
  } = JSON.parse(stateString);

  if (params.client_id && state.authParams.client_id !== params.client_id) {
    throw new InvalidClientError();
  }

  const client = await getClient(env, state.authParams.client_id);

  // Check the secret if this is a code grant flow
  const secretHash = await hash(params.client_secret);
  if (client.client_secret !== secretHash) {
    throw new InvalidClientError("Invalid Secret");
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
