import {
  AuthParams,
  Env,
  PKCEAuthorizationCodeGrantTypeParams,
  TokenResponse,
} from "../types";
import { Controller } from "tsoa";
import { base64ToHex } from "../utils/base64";
import { User } from "../types/sql";
import { InvalidClientError, InvalidCodeVerifierError } from "../errors";
import { getClient } from "../services/clients";
import { computeCodeChallenge } from "../helpers/pkce";
import { generateAuthResponse } from "../helpers/generate-auth-response";

export async function pkceAuthorizeCodeGrant(
  env: Env,
  controller: Controller,
  params: PKCEAuthorizationCodeGrantTypeParams
): Promise<TokenResponse> {
  const stateInstance = env.stateFactory.getInstanceById(
    base64ToHex(params.code)
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

  if (state.authParams.client_id !== client.id) {
    throw new InvalidClientError();
  }

  if (!state.authParams.code_challenge_method) {
    throw new InvalidCodeVerifierError("Code challenge not available");
  }

  const challenge = await computeCodeChallenge(
    env,
    params.code_verifier,
    state.authParams.code_challenge_method
  );
  if (challenge !== state.authParams.code_challenge) {
    throw new InvalidCodeVerifierError();
  }

  // await setSilentAuthCookies(env, controller, state.user, state.authParams);

  return generateAuthResponse({
    env,
    ...state,
  });
}