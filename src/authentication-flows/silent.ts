import { Controller } from "@tsoa/runtime";
import { Context } from "hono";
import {
  getStateFromCookie,
  serializeStateInCookie,
} from "../services/cookies";
import { State as StateModel } from "../models";
import {
  AuthorizationResponseType,
  AuthParams,
  CodeChallengeMethod,
  Env,
  Profile,
} from "../types";
import renderAuthIframe from "../templates/authIframe";
import { base64ToHex } from "../utils/base64";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { headers } from "../constants";
import { Var } from "../types/Var";

export interface SilentAuthParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  controller: Controller;
  cookie_header: string | null;
  redirect_uri: string;
  state: string;
  response_type: AuthorizationResponseType;
  nonce?: string;
  code_challenge_method?: CodeChallengeMethod;
  code_challenge?: string;
  audience?: string;
  State?: typeof StateModel;
}

interface SuperState {
  userId: string;
  authParams: AuthParams;
  user: Profile;
}

export async function silentAuth({
  ctx,
  controller,
  cookie_header,
  redirect_uri,
  state,
  nonce,
  response_type,
  code_challenge_method,
  code_challenge,
  audience,
}: SilentAuthParams) {
  const { env } = ctx;

  const tokenState = getStateFromCookie(cookie_header);
  const redirectURL = new URL(redirect_uri);

  if (tokenState) {
    const stateInstance = env.stateFactory.getInstanceById(
      base64ToHex(tokenState),
    );
    const superStateString = await stateInstance.getState.query();

    if (superStateString) {
      const superState: SuperState = JSON.parse(superStateString);
      ctx.set("userId", superState.userId);

      // Update the cookie
      serializeStateInCookie(tokenState).forEach((cookie) => {
        controller.setHeader(headers.setCookie, cookie);
      });

      const tokenResponse = await generateAuthResponse({
        env,
        state,
        nonce,
        userId: superState.userId,
        authParams: {
          ...superState.authParams,
          audience,
          code_challenge_method,
          code_challenge,
        },
        user: superState.user as Profile,
        sid: tokenState,
        responseType: response_type,
      });

      return renderAuthIframe(
        controller,
        `${redirectURL.protocol}//${redirectURL.host}`,
        JSON.stringify(tokenResponse),
      );
    }
  }

  return renderAuthIframe(
    controller,
    `${redirectURL.protocol}//${redirectURL.host}`,
    JSON.stringify({
      error: "login_required",
      error_description: "Login required",
      state,
    }),
  );
}
