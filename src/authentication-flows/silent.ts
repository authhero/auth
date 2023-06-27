import { Controller } from "@tsoa/runtime";
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
} from "../types";
import renderAuthIframe from "../templates/authIframe";
import { base64ToHex } from "../utils/base64";
import {
  generateAuthResponse,
  generateCode,
} from "../helpers/generate-auth-response";
import { User } from "../types/sql/User";
import { headers } from "../constants";

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
  user: User;
}

export async function silentAuth({
  env,
  controller,
  cookie_header,
  redirect_uri,
  state,
  nonce,
  response_type,
  code_challenge_method,
  code_challenge,
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

      // Update the cookie
      serializeStateInCookie(tokenState).forEach((cookie) => {
        controller.setHeader(headers.setCookie, cookie);
      });

      try {
        switch (response_type) {
          case AuthorizationResponseType.CODE:
            const code = await generateCode({
              env,
              state,
              nonce,
              userId: superState.userId,
              authParams: {
                ...superState.authParams,
                code_challenge_method,
                code_challenge,
              },
              user: superState.user,
              sid: tokenState,
            });

            return renderAuthIframe(
              controller,
              `${redirectURL.protocol}//${redirectURL.host}`,
              JSON.stringify({
                code,
                state,
              })
            );
          case AuthorizationResponseType.IMPLICIT:
          case AuthorizationResponseType.TOKEN_ID_TOKEN:
            const tokenResponse = await generateAuthResponse({
              env,
              userId: superState.userId,
              state,
              nonce,
              authParams: superState.authParams,
              user: superState.user,
              sid: tokenState,
            });

            return renderAuthIframe(
              controller,
              `${redirectURL.protocol}//${redirectURL.host}`,
              JSON.stringify(tokenResponse)
            );
          default:
            throw new Error("Response type not supported");
        }
      } catch (error: any) {
        console.log(`Failed to generate token: ${error.message}`);
      }
    }
  }

  return renderAuthIframe(
    controller,
    `${redirectURL.protocol}//${redirectURL.host}`,
    JSON.stringify({
      error: "login_required",
      error_description: "Login required",
      state,
    })
  );
}
