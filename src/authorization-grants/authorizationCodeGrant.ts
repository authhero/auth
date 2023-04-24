import { Context } from "cloudworker-router";
import { base64ToHex } from "../utils/base64";
import { State } from "../models";
import {
  Env,
  AuthParams,
  AuthorizationCodeGrantTypeParams,
  PKCEAuthorizationCodeGrantTypeParams,
  TokenResponse,
} from "../types";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";
import { Controller } from "tsoa";

export async function authorizationCodeGrant(
  ctx: Context<Env>,
  controller: Controller,
  params:
    | AuthorizationCodeGrantTypeParams
    | PKCEAuthorizationCodeGrantTypeParams
): Promise<TokenResponse | null> {
  const stateInstance = State.getInstanceById(
    ctx.env.STATE,
    base64ToHex(params.code)
  );
  const stateString = await stateInstance.getState.query();
  const state: { userId: string; authParams: AuthParams } =
    JSON.parse(stateString);

  await setSilentAuthCookies(ctx, controller, state.userId, state.authParams);

  return generateAuthResponse({ ctx, ...state });
}
