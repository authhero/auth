import { base64ToHex } from "../utils/base64";
import { Controller } from "tsoa";
import {
  AuthorizationCodeGrantTypeParams,
  AuthParams,
  Env,
  TokenResponse,
} from "../types";
import { User } from "../types/sql";
import { InvalidClientError } from "../errors";
import { getClient } from "../services/clients";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import hash from "../utils/hash";

export async function authorizeCodeGrant(
  env: Env,
  controller: Controller,
  params: AuthorizationCodeGrantTypeParams,
): Promise<TokenResponse> {
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
  if (client.clientSecret !== secretHash) {
    throw new InvalidClientError("Invalid Secret");
  }

  // await setSilentAuthCookies(env, controller, state.user, state.authParams);

  const tokens = await generateAuthResponse({
    env,
    ...state,
  });

  return tokens;
}
