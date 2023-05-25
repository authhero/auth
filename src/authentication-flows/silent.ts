import { Controller } from "@tsoa/runtime";
import { getStateFromCookie } from "../services/cookies";
import { State as StateModel } from "../models";
import { Context } from "cloudworker-router";
import {
  AuthorizationResponseType,
  AuthParams,
  CodeChallengeMethod,
  Env,
} from "../types";
import { renderAuthIframe } from "../templates/render";
import { base64ToHex } from "../utils/base64";
import { generateAuthResponse, generateCode } from "../helpers/generate-auth-response";

export interface SilentAuthParams {
  env: Env;
  controller: Controller;
  cookie_header: string | null;
  redirect_uri: string;
  state: string;
  response_type: AuthorizationResponseType;
  nonce?: string;
  code_challenge_method?: CodeChallengeMethod;
  code_challenge?: string;
  State?: typeof StateModel;
}

interface SuperState {
  userId: string;
  authParams: AuthParams;
}

export async function silentAuth({
  env,
  controller,
  cookie_header,
  redirect_uri,
  state,
  nonce,
  response_type,
}: SilentAuthParams) {
  const tokenState = getStateFromCookie(cookie_header);
  const redirectURL = new URL(redirect_uri);

  if (tokenState) {
    const stateInstance = env.stateFactory.getInstanceById(
      base64ToHex(tokenState)
    );

    const superStateString = await stateInstance.getState.query();

    if (superStateString) {
      const superState: SuperState = JSON.parse(superStateString);

      // TODO: validate the codeChallenge

      try {
        switch (response_type) {
          case AuthorizationResponseType.CODE:
            const code = await generateCode({ env, state, nonce, ...superState })

            return renderAuthIframe(env.AUTH_TEMPLATES, controller, {
              targetOrigin: `${redirectURL.protocol}//${redirectURL.host}`,
              response: JSON.stringify({
                code,
                state,
              }),
            });
          case AuthorizationResponseType.IMPLICIT:
          case AuthorizationResponseType.TOKEN_ID_TOKEN:
            const tokenResponse = await generateAuthResponse({
              env,
              userId: superState.userId,
              state,
              nonce,
              authParams: superState.authParams,
            });

            return renderAuthIframe(env.AUTH_TEMPLATES, controller, {
              targetOrigin: `${redirectURL.protocol}//${redirectURL.host}`,
              response: JSON.stringify(tokenResponse),
            });
          default:
            throw new Error("Response type not supported");
        }
      } catch (error: any) {
        console.log(`Failed to generate token: ${error.message}`);
      }
    }
  }

  return renderAuthIframe(env.AUTH_TEMPLATES, controller, {
    targetOrigin: `${redirectURL.protocol}//${redirectURL.host}`,
    response: JSON.stringify({
      error: "login_required",
      error_description: "Login required",
      state,
    }),
  });
}
